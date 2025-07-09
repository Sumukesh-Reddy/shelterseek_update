const helpData = {
    mainQuestions: [
        {
            text: "Account & Profile",
            subQuestions: [
                { 
                    text: "Password Update", 
                    answer: "To update your password:\n1. Go to 'Account Settings'\n2. Click 'Security'\n3. Enter current password\n4. Set new password\n5. Confirm changes" 
                },
                { 
                    text: "Email Update", 
                    answer: "To change your email:\n1. Navigate to Profile\n2. Edit email address\n3. Verify via confirmation link\n4. Save changes" 
                },
                { 
                    text: "Account Deletion", 
                    answer: "To delete account:\n1. Visit Privacy Settings\n2. Request deletion\n3. Confirm via email\n4. All data will be permanently removed in 30 days"  
                }
            ]
        },
        {
            text: "Payment & Refunds",
            subQuestions: [
                { 
                    text: "Payment Failures", 
                    answer: "For payment issues:\n1. Check card details\n2. Ensure sufficient balance\n3. Try different payment method\n4. Contact bank if declined\n5. Retry after 30 minutes" 
                },
                { 
                    text: "Refund Timeline", 
                    answer: "Refunds processed within:\n- Credit Cards: 5-7 business days\n- Debit Cards: 7-10 days\n- E-Wallets: 24-48 hours"  
                },
                { 
                    text: "Payment methods", 
                    answer: "Accepted payment options:\n- Visa/Mastercard/Amex\n- PayPal/Apple Pay/Google Pay\n- Bank transfers\n- Cryptocurrency (BTC/ETH)" 
                }
            ]
        },
        {
            text: "Bookings & Modifications",
            subQuestions: [
                { 
                    text: "Date changes", 
                    answer: "Modify booking dates:\n1. Open 'My Trips'\n2. Select booking\n3. Choose 'Change Dates'\n4. Pay difference if applicable\n5. Get new confirmation" 
                },
                { 
                    text: "Passenger Additions", 
                    answer: "Add passengers:\n1. Edit booking\n2. 'Add Traveler' option\n3. Enter details\n4. Pay additional fees\n5. Receive updated ticket" 
                },
                { 
                    text: "Booking Cancellations", 
                    answer:  "Cancel booking:\n1. Find reservation\n2. Select 'Cancel'\n3. Confirm cancellation\n4. Refund processed per policy\n5. Check email for confirmation" 
                }
            ]
        },
        {
            text: "Check-In & Stay",
            subQuestions: [
                { 
                    text: "Early Check-In", 
                    answer: "Early check-in:\n1. Request via app/website\n2. Subject to availability\n3. Additional fee may apply\n4. Receive confirmation 24h prior" 
                },
                { 
                    text: "ID Requirements", 
                    answer: "Required documents:\n- Government-issued photo ID\n- Booking confirmation\n- Credit card used for payment\n- Visa if required" 
                },
                { 
                    text: "Amenities", 
                    answer:  "Available amenities:\n- 24/7 concierge\n- Free WiFi\n- Breakfast included\n- Gym access\n- Airport transfers (on request)"  
                }
            ]
        },
        {
            text: "Cancellations & Policies",
            subQuestions: [
                { 
                    text: "Cancellation Policy", 
                    answer: "Cancellation terms:\n- Free cancellation 48h+ before\n- 50% refund 24-48h before\n- No refund <24h before\n- Special events non-refundable" 
                },
                { 
                    text: "Partial Refunds", 
                    answer: "Partial refunds issued for:\n- Government travel restrictions\n- Medical emergencies\n- Natural disasters\nRequires documentation" 
                },
                { 
                    text: "No-show Policy", 
                    answer: "No-show conditions:\n- Full booking amount charged\n- No refund issued\n- Contact within 2h for exceptions\n- Rebooking fee applies" 
                }
            ]
        }
    ]
};

let currentMainQuestion = null;

function showMainQuestions() {
    const chatMessages = document.getElementById('chatMessages');
    chatMessages.innerHTML = `
        <div class="message bot-message">
            <p>How can we assist with your travel plans?</p>
            <div class="quick-replies" id="main-questions">
                ${helpData.mainQuestions.map((q, i) => `
                    <div class="quick-option" data-main="${q.text}">
                        ${q.text}
                    </div>
                `).join('')}
            </div>
            <div class="timestamp">${new Date().toLocaleTimeString()}</div>
        </div>
    `;
    // Attach event listeners
    document.querySelectorAll('#main-questions .quick-option').forEach(el => {
        el.addEventListener('click', (e) => {
            const mainText = el.getAttribute('data-main');
            if (mainText) showSubQuestions(mainText);
        });
    });
}

function showSubQuestions(mainQuestionText) {
    const mainQuestion = helpData.mainQuestions.find(q => q.text === mainQuestionText);
    const chatMessages = document.getElementById('chatMessages');
    
    chatMessages.innerHTML += `
        <div class="message user-message">
            <p>${mainQuestionText}</p>
            <div class="timestamp">${new Date().toLocaleTimeString()}</div>
        </div>
        <div class="message bot-message">
            <p>Select your specific query:</p>
            <div class="quick-replies" id="sub-questions">
                ${mainQuestion.subQuestions.map((sub, i) => `
                    <div class="quick-option" data-main="${mainQuestionText}" data-sub="${sub.text}">
                        ${sub.text}
                    </div>
                `).join('')}
                <div class="quick-option back-button" id="back-main">
                    ← Back to Main
                </div>
            </div>
            <div class="timestamp">${new Date().toLocaleTimeString()}</div>
        </div>
    `;
    // Attach event listeners
    document.querySelectorAll('#sub-questions .quick-option').forEach(el => {
        const subText = el.getAttribute('data-sub');
        if (subText) {
            el.addEventListener('click', () => {
                showAnswer(mainQuestionText, subText);
            });
        }
    });
    // Back to main menu
    document.getElementById('back-main').addEventListener('click', showMainQuestions);

    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function showAnswer(mainQuestionText, subQuestionText) {
    const chatMessages = document.getElementById('chatMessages');
    const question = helpData.mainQuestions
        .find(q => q.text === mainQuestionText)
        .subQuestions.find(sq => sq.text === subQuestionText);

    chatMessages.innerHTML += `
        <div class="message user-message">
            <p>${subQuestionText}</p>
            <div class="timestamp">${new Date().toLocaleTimeString()}</div>
        </div>
        <div class="message bot-message">
            <p>${question.answer.replace(/\n/g, '<br>')}</p>
            <div class="quick-replies" id="answer-options">
                <div class="quick-option" id="back-sub">
                    ← Back to ${mainQuestionText}
                </div>
                <div class="quick-option back-button" id="back-main2">
                    ← Main Menu
                </div>
            </div>
            <div class="timestamp">${new Date().toLocaleTimeString()}</div>
        </div>
    `;
    // Attach event listeners
    document.getElementById('back-sub').addEventListener('click', () => showSubQuestions(mainQuestionText));
    document.getElementById('back-main2').addEventListener('click', showMainQuestions);

    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Initialize chat
showMainQuestions();