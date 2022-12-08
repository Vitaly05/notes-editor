const { ipcRenderer, ipcMain } = require('electron')

document.execCommand('styleWithCSS', false, true)
ipcRenderer.invoke('checkDir')




// ELEMENTS

let toolButtons = document.querySelectorAll('.toolButton')
let saveAsButton = document.getElementById('saveAsButton')
let saveButton = document.getElementById('saveButton')
let openFileButton = document.getElementById('openFileButton')

let addCategoryButton = document.getElementById('addCategoryButton')

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

ipcRenderer.on('navigationHtml', (e, navigationHtml) => {
    navigationPanel.innerHTML = navigationHtml

    document.querySelectorAll('.conspectButton').forEach(button => {
        conspectButtonClickListener(button)
    })

    addCategoryButtonClickListener()
    deleteCategoryButtonClickListener()
})

function conspectButtonClickListener(button) {
    button.addEventListener('click', () => {
        selectedConspectPath = button.dataset['filepath']
        ipcRenderer.invoke('openConspect', selectedConspectPath)
    })
}

function addCategoryButtonClickListener() {
    document.getElementById('addCategoryButton').addEventListener('click', () => {
        showAddCategoryField(true)

        addCategory_SaveButtonClickListener()
        addCategory_CancelButtonClickListener()
    })
}

function deleteCategoryButtonClickListener() {
    document.querySelectorAll('.deleteCategoryButton').forEach(button => {
        button.addEventListener('click', () => {
            ipcRenderer.invoke('deleteCategory', button.dataset['categorypath'])
        })
    })
}

function addCategory_CancelButtonClickListener() {
    document.getElementById('addCategory_CancelButton').addEventListener('click', () => {
        showAddCategoryField(false)

        addCategoryButtonClickListener()
        deleteCategoryButtonClickListener()
    })
}

function addCategory_SaveButtonClickListener() {
    document.getElementById('addCategory_SaveButton').addEventListener('click', () => {
        const addCategoryInput = document.getElementById('addCategoryInput')
        if (addCategoryInput == null || addCategoryInput.value.trim() == '') {
            console.log('incorrect name')
            return
        }

        ipcRenderer.invoke('addCategory', addCategoryInput.value.trim())


        showAddCategoryField(false)

        addCategoryButtonClickListener()
        deleteCategoryButtonClickListener()
    })
}




// IPC

ipcRenderer.on('setCanvasData', (e, fileContent) => {
    canvas.innerHTML = fileContent
})




// FUNCTIONS

function showAddCategoryField(showField) {
    if (showField) {
        document.getElementById('addCategoryPanel').innerHTML = '<div id="addCategory"><input id="addCategoryInput"></input><br /><div id="addCategoryButtons"><button class="addCategoryButton" id="addCategory_SaveButton">Сохранить</button><button class="addCategoryButton" id="addCategory_CancelButton">Отмена</button></div></div>'
    } else {
        document.getElementById('addCategoryPanel').innerHTML = '<button class="addButton" id="addCategoryButton"><i class="fa fa-add"></i><p>Добавить<br />категорию</p></button>'
    }
}