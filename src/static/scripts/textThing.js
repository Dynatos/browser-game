// const alphabets = [
//   ['A',   'B',   'C',   'D',   'E',   'F',   'G',   'H',   'I',   'J',   'K',   'L',   'M',   'N',   'O',   'P',   'Q',   'R',   'S',   'T',   'U',   'V',   'W',   'X',   'Y',   'Z'],
//   ['a',   'b',   'c',   'd',   'e',   'f',   'g',   'h',   'i',   'j',   'k',   'l',   'm',   'n',   'o',   'p',   'q',   'r',   's',   't',   'u',   'v',   'w',   'x',   'y',   'z']
// ];

//const desiredLetters = ['a','s','d','f'];
const desiredLetters = ['j','k','l',';'];
const display = document.querySelector('#display');
const input = document.querySelector('#input');
const cor = document.querySelector('#correct');
const inc = document.querySelector('#incorrect');
let element = document.createElement('div');
let currentLetter;
let usersInput;
let mistakes = 0;
let correct = 0;
let corNum = document.createElement('div');
let incNum = document.createElement('div');

element.className = 'display';

const getLetterByArgumentArray = (arr) => {
  console.log('getletterbyarguemtnarray getting a letter at random');
  const num = Math.floor(Math.random() * arr.length);
  console.log('new letter is ', arr[num]);
  return arr[num];
};

const getLetter = (array) => {
  console.log('getletter called');
  console.log('currentLetter before: ', currentLetter);
  currentLetter = getLetterByArgumentArray(array);
  console.log('currentLetter after: ', currentLetter);
  element.innerText = currentLetter;
  if (!display.childNodes[0]) {
    display.appendChild(element);
    //display.removeChild(display.childNodes[0]);
  }
};

const flashRed = () => {
  console.log('flashing red');
  display.backgroundColor = 'red';
  setTimeout(() => {display.backgroundColor = 'white'}, 950);
};

const compareInput = () => {
  console.log('comparing inputs');
  usersInput = input.value;
  console.log('input.value before: ', input.value);
  input.value = '';
  console.log('input.value after: ', input.value);
  console.log(`currentletter: ${currentLetter}`);
  if (usersInput === currentLetter) {
    console.log('user\'s input was correct ', usersInput, ' vs ', currentLetter);
    getLetter(desiredLetters);
    correct++;
  }
  else {
    console.log('user\'s input was incorrect ', usersInput, ' vs ', currentLetter);
    flashRed();
    mistakes++;
  }
};

const score = () => {
  corNum.innerText = correct.toString();
  incNum.innerText = mistakes.toString();
  if (!cor.childNodes[0] || !inc.childNodes[0]) {
    cor.appendChild(corNum);
    inc.appendChild(incNum);
  }
};

input.oninput = () => {console.log('input put in, calling compareinput');compareInput();score();};

if (!currentLetter) {
  console.log('setting initial letter');
  getLetter(desiredLetters);
}