class ResultsManager {
    constructor() {
        this.profileData = JSON.parse(localStorage.getItem('profileData')) || null;
        this.initializeEventListeners();
        this.renderResults();
    }

    initializeEventListeners() {
        document.getElementById('regenerate-opener').addEventListener('click', () => this.regenerateOpener());
        document.getElementById('copy-opener').addEventListener('click', () => this.copyOpener());
        document.getElementById('save-edits').addEventListener('click', () => this.saveEdits());
    }

    renderResults() {
        if (!this.profileData) {
            window.location.href = 'dashboard.html';
            return;
        }

        this.renderAnalysisResults();
        this.renderOpeners();
    }

    renderAnalysisResults() {
        const analysisResults = document.getElementById('analysis-results');
        const confidenceScore = document.getElementById('confidence-score');

        // Set overall confidence score
        confidenceScore.textContent = `Confidence: ${(this.profileData.metadata.processing_stats.confidence_metrics.text * 100).toFixed(1)}%`;

        analysisResults.innerHTML = `
            <form id="profile-edit-form">
                <div class="analysis-section">
                    <h6>Basic Information</h6>
                    <div class="mb-3">
                        <label class="form-label">Name</label>
                        <input type="text" class="form-control" name="name" 
                            value="${this.profileData.profile_data.basic_info.name || ''}"
                            data-path="profile_data.basic_info.name">
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Age</label>
                        <input type="number" class="form-control" name="age" 
                            value="${this.profileData.profile_data.basic_info.age || ''}"
                            data-path="profile_data.basic_info.age">
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Occupation</label>
                        <input type="text" class="form-control" name="occupation" 
                            value="${this.profileData.profile_data.basic_info.occupation.title || ''}"
                            data-path="profile_data.basic_info.occupation.title">
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Education</label>
                        <input type="text" class="form-control" name="education" 
                            value="${this.profileData.profile_data.basic_info.education.school || ''}"
                            data-path="profile_data.basic_info.education.school">
                    </div>
                </div>

                <div class="analysis-section">
                    <h6>Interests</h6>
                    <div id="interests-container">
                        ${this.renderInterestsEditor()}
                    </div>
                    <button type="button" class="btn btn-outline-primary btn-sm mt-2" id="add-interest">
                        <i class="bi bi-plus"></i> Add Interest
                    </button>
                </div>

                <div class="analysis-section">
                    <h6>Visual Elements</h6>
                    <div class="visual-elements-container">
                        ${this.renderVisualElementsEditor()}
                    </div>
                </div>

                <div class="analysis-section">
                    <h6>Bio Analysis</h6>
                    <div class="mb-3">
                        <label class="form-label">Bio Text</label>
                        <textarea class="form-control" name="bio" rows="4"
                            data-path="profile_data.bio_analysis.text">${this.profileData.profile_data.bio_analysis?.text || ''}</textarea>
                    </div>
                </div>

                <button type="button" class="btn btn-primary" id="save-edits">
                    <i class="bi bi-check2"></i> Save Changes
                </button>
            </form>
        `;

        // Add event listeners for dynamic elements
        document.getElementById('add-interest').addEventListener('click', () => this.addInterestField());
        this.initializeRemoveButtons();
    }

    renderInterestsEditor() {
        const interests = this.profileData.profile_data.interests.raw_interests;
        return interests.map((interest, index) => `
            <div class="input-group mb-2">
                <input type="text" class="form-control interest-input" 
                    value="${interest}"
                    data-index="${index}">
                <button type="button" class="btn btn-outline-danger remove-interest" data-index="${index}">
                    <i class="bi bi-trash"></i>
                </button>
            </div>
        `).join('');
    }

    renderVisualElementsEditor() {
        return this.profileData.visual_features.detected_categories
            .map((category, index) => `
                <div class="visual-element mb-2">
                    <div class="input-group">
                        <input type="text" class="form-control" 
                            value="${category.category_name}"
                            data-path="visual_features.detected_categories[${index}].category_name">
                        <input type="text" class="form-control" 
                            value="${category.elements.join(', ')}"
                            data-path="visual_features.detected_categories[${index}].elements">
                        <button type="button" class="btn btn-outline-danger remove-visual" data-index="${index}">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                </div>
            `).join('');
    }

    addInterestField() {
        const container = document.getElementById('interests-container');
        const newIndex = container.children.length;
        const newInterestHtml = `
            <div class="input-group mb-2">
                <input type="text" class="form-control interest-input" 
                    value=""
                    data-index="${newIndex}">
                <button type="button" class="btn btn-outline-danger remove-interest" data-index="${newIndex}">
                    <i class="bi bi-trash"></i>
                </button>
            </div>
        `;
        container.insertAdjacentHTML('beforeend', newInterestHtml);
        this.initializeRemoveButtons();
    }

    initializeRemoveButtons() {
        document.querySelectorAll('.remove-interest').forEach(button => {
            button.addEventListener('click', (e) => {
                const index = e.target.closest('button').dataset.index;
                e.target.closest('.input-group').remove();
                this.updateInterestsIndices();
            });
        });

        document.querySelectorAll('.remove-visual').forEach(button => {
            button.addEventListener('click', (e) => {
                const index = e.target.closest('button').dataset.index;
                e.target.closest('.visual-element').remove();
                this.updateVisualElementsIndices();
            });
        });
    }

    updateInterestsIndices() {
        document.querySelectorAll('.interest-input').forEach((input, index) => {
            input.dataset.index = index;
            input.nextElementSibling.dataset.index = index;
        });
    }

    updateVisualElementsIndices() {
        document.querySelectorAll('.visual-element').forEach((element, index) => {
            const inputs = element.querySelectorAll('input');
            inputs[0].dataset.path = `visual_features.detected_categories[${index}].category_name`;
            inputs[1].dataset.path = `visual_features.detected_categories[${index}].elements`;
            element.querySelector('button').dataset.index = index;
        });
    }

    async saveEdits() {
        const form = document.getElementById('profile-edit-form');
        const updatedData = { ...this.profileData };

        // Update basic info
        form.querySelectorAll('input[data-path], textarea[data-path]').forEach(input => {
            const path = input.dataset.path.split('.');
            let current = updatedData;
            for (let i = 0; i < path.length - 1; i++) {
                current = current[path[i]];
            }
            current[path[path.length - 1]] = input.value;
        });

        // Update interests
        const interests = Array.from(document.querySelectorAll('.interest-input'))
            .map(input => input.value.trim())
            .filter(value => value);
        updatedData.profile_data.interests.raw_interests = interests;

        // Save updated data
        this.profileData = updatedData;
        localStorage.setItem('profileData', JSON.stringify(updatedData));

        // Show success message
        const alert = document.createElement('div');
        alert.className = 'alert alert-success mt-3';
        alert.textContent = 'Changes saved successfully!';
        form.appendChild(alert);
        setTimeout(() => alert.remove(), 3000);

        // Regenerate opener with updated data
        await this.regenerateOpener();
    }

    async regenerateOpener() {
        const openerContainer = document.getElementById('suggested-openers');
        const regenerateBtn = document.getElementById('regenerate-opener');
        
        try {
            regenerateBtn.disabled = true;
            openerContainer.innerHTML = '<div class="text-center"><div class="spinner-border"></div></div>';

            const response = await fetch('/api/generate-opener', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify(this.profileData)
            });

            if (!response.ok) throw new Error('Failed to generate opener');
            
            const data = await response.json();
            this.renderOpener(data);
        } catch (error) {
            openerContainer.innerHTML = `
                <div class="alert alert-danger">
                    Failed to generate opener. Please try again.
                </div>
            `;
        } finally {
            regenerateBtn.disabled = false;
        }
    }

    renderOpener(data) {
        const container = document.getElementById('suggested-openers');
        container.innerHTML = `
            <div class="opener-card p-3">
                <div class="d-flex justify-content-between align-items-start">
                    <div class="opener-text">${data.opener}</div>
                    <button class="btn btn-sm btn-outline-primary copy-button">
                        <i class="bi bi-clipboard"></i>
                    </button>
                </div>
                <div class="opener-metadata mt-2">
                    <small>
                        Source: ${data.source} | 
                        Confidence: ${(data.confidence * 100).toFixed(1)}% | 
                        Generated: ${new Date().toLocaleTimeString()}
                    </small>
                </div>
            </div>
        `;
    }

    copyOpener() {
        const openerText = document.querySelector('.opener-text').textContent;
        navigator.clipboard.writeText(openerText).then(() => {
            const copyBtn = document.querySelector('.copy-button');
            copyBtn.innerHTML = '<i class="bi bi-check"></i>';
            setTimeout(() => {
                copyBtn.innerHTML = '<i class="bi bi-clipboard"></i>';
            }, 2000);
        });
    }
}

// Initialize the results manager when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new ResultsManager();
}); 