const { ipcRenderer } = require('electron')

document.execCommand('styleWithCSS', false, true)
ipcRenderer.invoke('checkDir')




// ELEMENTS

let toolButtons = document.querySelectorAll('.toolButton')
let saveAsButton = document.getElementById('saveAsButton')
let saveButton = document.getElementById('saveButton')
let openFileButton = document.getElementById('openFileButton')

let canvas = document.getElementById('canvas')
let navigationPanel = document.getElementById('navigationPanel')




// VARIABLES

let selectedConspectPath




// BUTTONS CLICKS

toolButtons.forEach(button => {
    button.addEventListener('click', () => {
        document.execCommand(button.dataset['element'], false, button.dataset['param'])
    })
})

saveAsButton.addEventListener('click', () => {
    ipcRenderer.invoke('saveFileAs', canvas.innerHTML)
})

saveButton.addEventListener('click', () => {
    ipcRenderer.invoke('saveConspect', selectedConspectPath, canvas.innerHTML)
})

openFileButton.addEventListener('click', () => {
    ipcRenderer.invoke('openFile')
})

function conspectButtonClickListener(button) {
    button.addEventListener('click', () => {
        selectedConspectPath = button.dataset['filepath']
        ipcRenderer.invoke('openConspect', selectedConspectPath)
    })
}




// IPC

ipcRenderer.on('setCanvasData', (e, fileContent) => {
    canvas.innerHTML = fileContent
})

ipcRenderer.on('navigationHtml', (e, navigationHtml) => {
    navigationPanel.innerHTML = navigationHtml

    document.querySelectorAll('.conspectButton').forEach(button => {
        conspectButtonClickListener(button)
    })
})