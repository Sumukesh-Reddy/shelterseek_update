//97
const mongoose = require('mongoose');
const { GridFSBucket } = require('mongodb');
const fs = require('fs');
const Listing = require('../model/Listing');
const { Host } = require('../model/usermodel');
const Image = require('../model/Image');

// Connect to HostAdmin database
const hostAdminDB = mongoose.createConnection(process.env.HOST_ADMIN_URI);

// Set up GridFS bucket
let gfs;
hostAdminDB.once('open', () => {
  gfs = new GridFSBucket(hostAdminDB.db, {
    bucketName: 'images'
  });
});

const ListingModel = hostAdminDB.model('Listing', require('../model/Listing').schema);

// Helper function to upload files to GridFS
const uploadFilesToGridFS = async (files) => {
  const imageIds = [];
  for (const file of files) {
    const readableStream = fs.createReadStream(file.path);
    const uploadStream = gfs.openUploadStream(file.originalname, {
      contentType: file.mimetype
    });
    await new Promise((resolve, reject) => {
      readableStream.pipe(uploadStream)
        .on('error', reject)
        .on('finish', async () => {
          // Create Image document reference
          const image = new Image({
            _id: uploadStream.id,
            filename: file.originalname,
            contentType: file.mimetype,
            length: uploadStream.length
          });
          await image.save();
          imageIds.push(uploadStream.id);
          resolve();
        });
    });
  }
  return imageIds;
};

// Create Listing
exports.createListing = async (req, res) => {
  try {
    const currentUser = req.user || JSON.parse(req.body.currentUser);
    if (!currentUser || currentUser.accountType !== 'host') {
      return res.status(403).json({
        status: 'fail',
        message: 'Only hosts can create listings'
      });
    }
    const host = await Host.findOne({ email: currentUser.email });
    if (!host) {
      return res.status(404).json({
        status: 'fail',
        message: 'Host not found'
      });
    }
    const listingData = {
      hostId: host._id,
      name: host.name,
      email: host.email,
      ...req.body,
      coordinates: {
        lat: parseFloat(req.body.latitude),
        lng: parseFloat(req.body.longitude)
      },
      status: 'pending'
    };
    // Amenities as array
    if (typeof listingData.amenities === 'string') {
      listingData.amenities = listingData.amenities.split(',').filter(Boolean);
    }
    // Handle file uploads with GridFS
    if (req.files && req.files.length > 0) {
      listingData.images = await uploadFilesToGridFS(req.files);
    }
    const newListing = await ListingModel.create(listingData);
    res.status(201).json({
      status: 'success',
      data: { listing: newListing }
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message
    });
  }
};

// Serve images from GridFS
exports.getImage = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        status: 'fail',
        message: 'Invalid image ID'
      });
    }
    const file = await hostAdminDB.db.collection('images.files').findOne({
      _id: new mongoose.Types.ObjectId(id)
    });
    if (!file) {
      return res.status(404).json({
        status: 'fail',
        message: 'Image not found'
      });
    }
    const downloadStream = gfs.openDownloadStream(file._id);
    res.set('Content-Type', file.contentType || 'image/jpeg');
    downloadStream.pipe(res);
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message
    });
  }
};

// Get all listings
exports.getListings = async (req, res) => {
  try {
    const listings = await ListingModel.find();
    res.status(200).json({
      status: 'success',
      results: listings.length,
      data: { listings }
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message
    });
  }
};

// Update listing status (admin)
exports.updateListingStatus = async (req, res) => {
  try {
    const { listingId } = req.params;
    const { status } = req.body;
    if (!['verified', 'rejected'].includes(status)) {
      return res.status(400).json({
        status: 'fail',
        message: 'Invalid status. Must be "verified" or "rejected"'
      });
    }
    const listing = await ListingModel.findByIdAndUpdate(
      listingId,
      { status },
      { new: true, runValidators: true }
    );
    if (!listing) {
      return res.status(404).json({
        status: 'fail',
        message: 'Listing not found'
      });
    }
    res.status(200).json({
      status: 'success',
      data: { listing }
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message
    });
  }
};

// Get Listing by ID
exports.getListingById = async (req, res) => {
  try {
    const listing = await ListingModel.findById(req.params.id);
    res.status(200).json({
      status: 'success',
      data: { listing }
    });
  } catch (err) {
    res.status(400).json({ status: 'fail', message: err.message });
  }
};

// Update Listing (with support for image add/remove)
exports.updateListing = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        status: 'fail',
        message: 'Invalid listing ID'
      });
    }
    // Prepare update data
    const updateData = { ...req.body };

    // If coordinates are being updated
    if (req.body.latitude && req.body.longitude) {
      updateData.coordinates = {
        lat: parseFloat(req.body.latitude),
        lng: parseFloat(req.body.longitude)
      };
    }
    // Amenities as array
    if (typeof updateData.amenities === 'string') {
      updateData.amenities = updateData.amenities.split(',').filter(Boolean);
    }

    // Handle removed images
    let imagesToKeep = [];
    if (req.body.removedImages) {
      // removedImages is a comma-separated list of image IDs to remove
      const removedIds = req.body.removedImages.split(',').filter(Boolean);
      // Get current listing to find which images to keep
      const currentListing = await ListingModel.findById(id);
      if (currentListing && currentListing.images && currentListing.images.length > 0) {
        imagesToKeep = currentListing.images.filter(imgId => !removedIds.includes(String(imgId)));
      }
      // Optionally: Delete images from GridFS and Image collection
      // for (const imgId of removedIds) {
      //   try {
      //     await gfs.delete(new mongoose.Types.ObjectId(imgId));
      //     await Image.deleteOne({ _id: imgId });
      //   } catch (e) { /* ignore */ }
      // }
    } else {
      // If no removedImages provided, keep all current images
      const currentListing = await ListingModel.findById(id);
      if (currentListing && currentListing.images) {
        imagesToKeep = currentListing.images;
      }
    }

    // Handle new images
    let newImageIds = [];
    if (req.files && req.files.length > 0) {
      newImageIds = await uploadFilesToGridFS(req.files);
    }

    // Combine images to keep and new images
    updateData.images = [...imagesToKeep, ...newImageIds];

    // Update listing
    const updatedListing = await ListingModel.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    );
    if (!updatedListing) {
      return res.status(404).json({
        status: 'fail',
        message: 'Listing not found'
      });
    }
    res.status(200).json({
      status: 'success',
      data: { listing: updatedListing }
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message
    });
  }
};

// Delete Listing
exports.deleteListing = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        status: 'fail',
        message: 'Invalid listing ID'
      });
    }
    const deleted = await ListingModel.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({
        status: 'fail',
        message: 'Listing not found'
      });
    }
    res.status(200).json({
      status: 'success',
      message: 'Listing deleted'
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message
    });
  }
};