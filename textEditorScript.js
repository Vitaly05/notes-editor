const { ipcRenderer } = require('electron')

document.execCommand('styleWithCSS', false, true)

let buttons = document.querySelectorAll('.toolButton')

buttons.forEach(button => {
    button.addEventListener('click', () => {
        document.execCommand(button.dataset['element'], false, button.dataset['param'])
    })
})