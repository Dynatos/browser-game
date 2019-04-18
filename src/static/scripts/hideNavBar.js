const hideButton =           document.querySelector('#hide-left-nav--button');
const navInternalComponent = document.querySelector('.navigation-shell-internal-component');
const navBarParent =         document.querySelector('.left-navbar-highest-parent');
const statDisplayAlignment = document.querySelector('.inventory-stat-display--alignment');
const navBarButtons =        document.querySelectorAll('div.left-navbar-highest-parent div.left-navbar-element');

const isHiddenObj = {isHidden: false};

hideButton.addEventListener('click', (event) => {
  event.preventDefault();
  if (isHiddenObj.isHidden) {
    isHiddenObj.isHidden = !isHiddenObj.isHidden;
    hideButton.innerText = '<';
    navBarParent.removeAttribute('style');
    navBarButtons.forEach(e => {e.removeAttribute('style')});
    navInternalComponent.removeAttribute('style');
    statDisplayAlignment.removeAttribute('style');
    return;
  }
  isHiddenObj.isHidden = !isHiddenObj.isHidden;
  hideButton.innerText = '>';
  navBarParent.setAttribute('style', 'width: 38px;');
  navBarButtons.forEach(e => {e.setAttribute('style', 'visibility: hidden;')});
  navInternalComponent.setAttribute('style', 'width: calc(100% - 38px);');
  statDisplayAlignment.setAttribute('style', 'align-items: center;');
});