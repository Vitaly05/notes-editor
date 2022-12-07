const { ipcRenderer } = require('electron')

document.execCommand('styleWithCSS', false, true)

let buttons = document.querySelectorAll('.toolButton')

buttons.forEach(button => {
    button.addEventListener('click', () => {
        document.execCommand(button.dataset['element'], false, button.dataset['param'])
    })
})


let saveFileButton = document.getElementById('saveFileButton')
let canvas = document.getElementById('canvas')

saveFileButton.addEventListener('click', () => {
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

ipcRenderer.on('navigationHtml', (e, navigationHtml) => {
    navigationPanel.innerHTML = navigationHtml

    document.querySelectorAll('.conspectButton').forEach(button => {
        // const filePath = button.dataset['filepath']
        // console.log(filePath)
        button.addEventListener('click', () => {
            ipcRenderer.invoke('openConspect', button.dataset['filepath'])
        })
    })
})