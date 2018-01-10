const updateState = (caller, focusOrBlur) => {
  if (caller === 'username' && focusOrBlur === 'focus') {
    unRules.className = 'display-inline-block';
  }
  if (caller === 'password' && focusOrBlur === 'focus') {
    pwRules.className = 'display-inline-block';
  }
  if (caller === 'username' && focusOrBlur === 'blur') {
    unRules.className = 'display-none';
  }
  if (caller === 'password' && focusOrBlur === 'blur') {
    pwRules.className = 'display-none';
  }
};

const allowSubmit = () => {
  submit.className = "display-inline-block";
};
const unRules = document.querySelector("#signup-un-rules");
const pwRules = document.querySelector("#signup-pw-rules");
const unText = document.querySelector("#signup-un-field");
const pwText = document.querySelector("#signup-pw-field");
const pwcText = document.querySelector("#signup-pwc-field");
const submit = document.querySelector("#signup-submit");

unText.onfocus = () => { updateState('username', 'focus') };
unText.onblur = () => { updateState('username', 'blur') };
pwText.onfocus = () => { updateState('password', 'focus') };
pwText.onblur = () => {
  updateState('password', 'blur');
  if (pwText.value === pwcText.value && pwText.value.length >= 16 && pwcText.value.length >= 16 &&
    pwText.value.length <= 40 && pwcText.value.length <= 40) {
    allowSubmit();
  }
  else submit.className = 'display-none';
};
pwcText.onfocus = () => { updateState('password', 'focus') };
pwcText.onblur = () => {
  updateState('password', 'blur');
  if (pwText.value === pwcText.value && pwText.value.length >= 16 && pwcText.value.length >= 16 &&
    pwText.value.length <= 40 && pwcText.value.length <= 40) {
    allowSubmit();
  }
  else submit.className = 'display-none';
};

const setInitialState = (function() {
  unRules.className = 'display-none';
  pwRules.className = 'display-none';
  submit.className = 'display-none';
})();
