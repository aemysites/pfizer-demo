function showLoader() {
    const loaders = this.dialog.querySelectorAll('.loader');
    loaders.forEach((loader) => {
        loader.style.display = 'flex';
    });

}

function hideLoader() {
    const loaders = this.dialog.querySelectorAll('.loader');
    loaders.forEach((loader) => {
        loader.style.display = 'none';
    });
}

export default {
    showLoader,
    hideLoader
}
