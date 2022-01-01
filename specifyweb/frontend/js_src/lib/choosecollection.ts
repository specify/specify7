import '../css/base.css';
import '../css/login.css';
import '../css/choosecollection.css';

window.addEventListener('load', () => {
  if (document.querySelector('input[name="collection"]:checked'))
    document.querySelector('input[type="submit"]')?.focus();
});
