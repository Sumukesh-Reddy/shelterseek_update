// JavaScript
document.addEventListener('DOMContentLoaded', () => {
    // Add symbols to all questions
    document.querySelectorAll('.question').forEach(question => {
        const symbol = document.createElement('div');
        symbol.className = 'symbol';
        question.appendChild(symbol);
    });

    // Handle question interactions
    document.querySelectorAll('.question').forEach(question => {
        question.addEventListener('click', () => {
            // Toggle answer visibility or handle click action
            console.log('Question clicked:', question.textContent);
        });
    });

    // Handle help button click
    document.querySelector('.helpbutton').addEventListener('click', () => {
        // Add contact form logic or redirect
        console.log('Contact button clicked');
    });
});

document.addEventListener('DOMContentLoaded', () => {
    const questions = document.querySelectorAll('.question-container');

    questions.forEach(container => {
        const question = container.querySelector('.question');
        const answer = container.querySelector('.answer');
        const symbol = container.querySelector('.symbol');

        const toggleAnswer = () => {
            const isOpen = answer.style.maxHeight && answer.style.maxHeight !== '0px';
            
            // Close all answers first
            questions.forEach(otherContainer => {
                if (otherContainer !== container) {
                    otherContainer.querySelector('.answer').style.maxHeight = '0';
                    otherContainer.querySelector('.symbol').textContent = '+';
                }
            });

            // Toggle current answer
            if (isOpen) {
                answer.style.maxHeight = '0';
                symbol.textContent = '+';
            } else {
                answer.style.maxHeight = answer.scrollHeight + 'px';
                symbol.innerHTML = `&times;`;
            }
        };

        question.addEventListener('click', toggleAnswer);
        symbol.addEventListener('click', toggleAnswer);
    });
});