function showAddNewPagePanel() {
    const showAddPagePanel = this.dialog.querySelector('.show-addpage');
    const addPagePanel = this.dialog.querySelector('.add-page-panel');
    addPagePanel.style.display = 'block';
    showAddPagePanel.style.display = 'none';
}

function hideAddNewPagePanel() {
    const showAddPagePanel = this.dialog.querySelector('.show-addpage');
    const addPagePanel = this.dialog.querySelector('.add-page-panel');
    addPagePanel.style.display = 'none';
    showAddPagePanel.style.display = 'block';
}

export default {
    showAddNewPagePanel,
    hideAddNewPagePanel
}