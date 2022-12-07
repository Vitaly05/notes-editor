const { ipcRenderer } = require('electron')

document.execCommand('styleWithCSS', false, true)

let buttons = document.querySelectorAll('.toolButton')

buttons.forEach(button => {
    button.addEventListener('click', () => {
        document.execCommand(button.dataset['element'], false, button.dataset['param'])
    })
})


let saveAsButton = document.getElementById('saveAsButton')
let canvas = document.getElementById('canvas')

saveAsButton.addEventListener('click', () => {
    ipcRenderer.invoke('saveFileAs', canvas.innerHTML)
})


let openFileButton = document.getElementById('openFileButton')

openFileButton.addEventListener('click', () => {
    ipcRenderer.invoke('openFile')
})

ipcRenderer.on('setCanvasData', (e, fileContent) => {
    canvas.innerHTML = fileContent
})



let navigationPanel = document.getElementById('navigationPanel')

ipcRenderer.invoke('checkDir')


let selectedConspectPath

ipcRenderer.on('navigationHtml', (e, navigationHtml) => {
    navigationPanel.innerHTML = navigationHtml

    document.querySelectorAll('.conspectButton').forEach(button => {
        button.addEventListener('click', () => {
            selectedConspectPath = button.dataset['filepath']
            ipcRenderer.invoke('openConspect', selectedConspectPath)
        })
    })
})


let saveButton = document.getElementById('saveButton')

saveButton.addEventListener('click', () => {
    ipcRenderer.invoke('saveConspect', selectedConspectPath, canvas.innerHTML)
})