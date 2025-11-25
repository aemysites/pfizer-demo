import { getEnvURL } from '../review-actions.js';
import { getPageURL } from '../custom-views.js';

function initListeners() {
    if(this.status.status === 401) return;

    if(this.review.status === 'open') {
        this.addRemoveListeners();
        this.addnewPageListener();
    }

    if(this.review.status === 'submitted') {
        this.addApprovalListener();
    }

    this.addDialogCloseListener();
    this.addButtonListeners();
}

function addButtonListeners() {

    this.verbs.forEach((verb) => {
        const button = this.dialog.querySelector(`#hlx-${verb.id}`);
        if (button) {
            button.addEventListener('click', async (event) => {
                this.showLoader();

                event.target.classList.add('loading');

                await verb.f(this.review.reviewId);
                this.hideLoader();

                event.target.classList.remove('loading');

                this.dialog.close();
                window.sk.dialogIsOpened = false;
                if (verb.id === 'approve') {
                    const url = getPageURL(window.location.href);
                    window.location.href = getEnvURL(this.env, url.pathname, { state: 'live' });
                } else {
                    window.location.hash = '#openReview';
                    window.location.reload();
                }
            });
        }
    });
}

function addDialogCloseListener() {
    this.dialog.addEventListener('close', () => {
        window.sk.dialogIsOpened = false;
        const sk = document.querySelector('helix-sidekick');
        if(!sk) return;
        const dialog = sk.shadowRoot.querySelector('dialog');
        if(!dialog) return;
        dialog.remove();
    });
}

function addApprovalListener() {
    const hasPerms = this.getPermissions();
    const acceptCheckbox = this.dialog.querySelector('#accept_approval');
    const approveButton = this.dialog.querySelector('#hlx-approve');

    if (acceptCheckbox) {
        acceptCheckbox.addEventListener('change', () => {
            if (hasPerms === false) {
                approveButton.disabled = true;
                return;
            }

            if (acceptCheckbox.checked) {
                approveButton.disabled = false;
            } else {
                approveButton.disabled = true;
            }
        });
    }
}

function addRemoveListeners() {
    const removeButtons = this.dialog.querySelectorAll('.remove-page');
    removeButtons.forEach((btn) => {
        btn.addEventListener('click', async (event) => {
            event.preventDefault();
            this.showLoader();
            event.target.classList.add('loading');
            const btnPath = btn.getAttribute('data-path')
            this.removePage(btnPath);
            await this.updateReviewPanel()
            this.hideLoader();
            event.target.classList.remove('loading');
        })
    })
}

function addnewPageListener() {
    const showAddPageBtn = this.dialog.querySelector('.show-addpage');
    const cancelAddPageBtn = this.dialog.querySelector('.cancel-add-page');
    const AddPageBtn = this.dialog.querySelector('.add-page');
    const AddPageForm = this.dialog.querySelector('#addpageform');
    const inputField = this.dialog.querySelector('.add-page-input');
    const helpMessage = this.dialog.querySelector('.add-page-input-message');

    showAddPageBtn.addEventListener('click', async (event) => {
        event.preventDefault();
        this.showAddNewPagePanel();
        inputField.value = '';
        inputField.focus();
    });

    cancelAddPageBtn.addEventListener('click', async (event) => {
        event.preventDefault();
        this.resetAddToPage();
        this.hideAddNewPagePanel();
    });

    AddPageForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        this.resetAddToPage();
        const formData = new FormData(AddPageForm);
        const pages = this.formatPaths(formData.get('newpage').split("\n"));
        const isValid = this.isValidUrls(pages);
        if(isValid !== true) {
            inputField.classList.add('error');
            helpMessage.innerText = isValid;
            helpMessage.classList.add('error');
            return;
        }
        this.showLoader();
        AddPageBtn.classList.add('loading');
        this.addPages(pages);
        await this.updateReviewPanel()
        this.hideLoader();
        AddPageBtn.classList.remove('loading');
    });
}

export default {
    initListeners,
    addButtonListeners,
    addDialogCloseListener,
    addApprovalListener,
    addRemoveListeners,
    addnewPageListener
}
