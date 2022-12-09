const { ipcRenderer, ipcMain } = require('electron')

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

ipcRenderer.on('navigationHtml', (e, navigationHtml) => {
    navigationPanel.innerHTML = navigationHtml

    document.querySelectorAll('.conspectButton').forEach(button => {
        conspectButtonClickListener(button)
    })

    addCategoryButtonClickListener()
    deleteCategoryButtonClickListener()

    addConspectButtonClickListener()
})

function conspectButtonClickListener(button) {
    button.addEventListener('click', () => {
        selectedConspectPath = button.dataset['filepath']
        ipcRenderer.invoke('openConspect', selectedConspectPath)
    })
}



function addCategoryButtonClickListener() {
    document.getElementById('addCategoryButton').addEventListener('click', () => {
        showAddCategoryPanel(true)

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
        showAddCategoryPanel(false)

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


        showAddCategoryPanel(false)

        addCategoryButtonClickListener()
        deleteCategoryButtonClickListener()
    })
}



function addConspectButtonClickListener() {
    document.querySelectorAll('.addConspectButton').forEach(button => {
        button.addEventListener('click', () => {
            showAddConspectPanel(true, button.dataset['category'])

            addConspect_SaveButtonClickListener()
            addConspect_CancelButtonClickListener()
        })
    })
}

function addConspect_CancelButtonClickListener() {
    document.querySelectorAll('.addConspect_CancelButton').forEach(button => {
        button.addEventListener('click', () => {
            showAddConspectPanel(false, button.dataset['category'])
    
            addConspectButtonClickListener()
            //deleteConspectButtonClickListener()
        })
    })
}

function addConspect_SaveButtonClickListener() {
    document.querySelectorAll('.addConspect_SaveButton').forEach(button => {
        button.addEventListener('click', () => {
            let addConspectInput
            document.querySelectorAll('.addConspectInput').forEach(input => {
                if (input.dataset['category'] == button.dataset['category']) {
                    addConspectInput = input
                }
            })
            if (addConspectInput == null || addConspectInput.value.trim() == '') {
                console.log('incorrect name')
                return
            }
    
            ipcRenderer.invoke('addConspect', button.dataset['category'], addConspectInput.value.trim())
    
    
            showAddConspectPanel(false, button.dataset['category'])
    
            addConspectButtonClickListener()
            //deleteConspectButtonClickListener()
        })
    })
}




// IPC

ipcRenderer.on('setCanvasData', (e, fileContent) => {
    canvas.innerHTML = fileContent
})




// FUNCTIONS

function showAddCategoryPanel(showPanel) {
    if (showPanel) {
        document.getElementById('addCategoryPanel').innerHTML = '<div id="addCategory"><input id="addCategoryInput"></input><br /><div id="addCategoryButtons"><button class="addCategoryButton" id="addCategory_SaveButton">Сохранить</button><button class="addCategoryButton" id="addCategory_CancelButton">Отмена</button></div></div>'
    } else {
        document.getElementById('addCategoryPanel').innerHTML = '<button id="addCategoryButton"><i class="fa fa-add"></i><p>Добавить<br />категорию</p></button>'
    }
}

function showAddConspectPanel(showPanel, category) {
    if (showPanel) {
        document.querySelectorAll('.addConspectPanel').forEach(panel => {
            if (panel.dataset['category'] == category) {
                panel.innerHTML = `<div class="addConspect"><input class="addConspectInput" data-category="${category}"></input><br /><div class="addConspectButtons"><button class="addConspect_SaveButton" data-category="${category}">Сохранить</button><button class="addConspect_CancelButton" data-category="${category}">Отмена</button></div></div>`
            }
        })
    } else {
        document.querySelectorAll('.addConspectPanel').forEach(panel => {
            if (panel.dataset['category'] == category) {
                panel.innerHTML = `<button class="addConspectButton" data-category="${category}"><i class="fa fa-add"></i><p>Новый конспект</p></button>`
            }
        })
    }
}