const { ipcRenderer, ipcMain } = require('electron')

document.execCommand('styleWithCSS', false, true)
ipcRenderer.invoke('checkDir')




// ELEMENTS

let toolButtons = document.querySelectorAll('.toolButton')
let fontSelector = document.getElementById('fonts')
let fontSizeSelector = document.getElementById('fontSize')
let insertImageButton = document.getElementById('insertImageButton')

let saveAsButton = document.getElementById('saveAsButton')
let saveButton = document.getElementById('saveButton')
let openFileButton = document.getElementById('openFileButton')


let canvas = document.getElementById('canvas')
let conspectName = document.getElementById('conspectName')
let categoryName = document.getElementById('categoryName')
let nonSaveIndicator = document.getElementById('nonSaveIndicator')

let navigationPanel = document.getElementById('navigationPanel')

let autosaveTimer




// VARIABLES

const defaultName = 'Новый конспект'
const defaultCategory = 'Категория без названия'

let selectedConspect = {
    Name: defaultName,
    Category: defaultCategory
}




// SET DEFAULT VALUES

conspectName.value = selectedConspect.Name
categoryName.value = selectedConspect.Category



// BUTTONS CLICKS

toolButtons.forEach(button => {
    button.addEventListener('click', () => {
        document.execCommand(button.dataset['command'], false, button.dataset['param'])
    })
})

fontSelector.addEventListener('change', () => {
    const selectedIndex = fontSelector.selectedIndex
    const selectedFont = fontSelector.options[selectedIndex].value
    document.execCommand('fontName', false, selectedFont)
})
fontSizeSelector.addEventListener('change', () => {
    const selectedIndex = fontSizeSelector.selectedIndex
    const selectedSize = fontSizeSelector.options[selectedIndex].value
    document.execCommand('fontSize', false, selectedSize)
})
insertImageButton.addEventListener('click', () => {
    ipcRenderer.invoke('openImage')
})

saveAsButton.addEventListener('click', () => {
    ipcRenderer.invoke('saveFileAs', canvas.innerHTML)
})

conspectName.addEventListener('input', () => {
    selectedConspect.Name = conspectName.value
})

categoryName.addEventListener('input', () => {
    selectedConspect.Category = categoryName.value
})

saveButton.addEventListener('click', () => {
    saveConspect()
    startAutosaveTimer()
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
    deleteConspectButtonClickListener()
})

function conspectButtonClickListener(button) {
    button.addEventListener('click', () => {
        selectedConspect.Name = button.dataset['name']
        selectedConspect.Category = button.dataset['category']

        ipcRenderer.invoke('openConspect', selectedConspect.Category, selectedConspect.Name)
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
            ipcRenderer.invoke('deleteCategory', button.dataset['category'])
        })
    })
}

function addCategory_CancelButtonClickListener() {
    document.getElementById('addCategory_CancelButton').addEventListener('click', () => {
        showAddCategoryPanel(false)

        addCategoryButtonClickListener()
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

        showAddCategoryPanel()
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

function deleteConspectButtonClickListener() {
    document.querySelectorAll('.deleteConspectButton').forEach(button => {
        button.addEventListener('click', () => {
            ipcRenderer.invoke('deleteConspect', button.dataset['category'], button.dataset['name'])
        })
    })
}

function addConspect_CancelButtonClickListener() {
    document.querySelectorAll('.addConspect_CancelButton').forEach(button => {
        button.addEventListener('click', () => {
            showAddConspectPanel(false, button.dataset['category'])
    
            addConspectButtonClickListener()
        })
    })
}

function addConspect_SaveButtonClickListener() {
    document.querySelectorAll('.addConspect_SaveButton').forEach(button => {
        button.addEventListener('click', () => {
            let addConspectInput
            let newConspectCategory = button.dataset['category']
            document.querySelectorAll('.addConspectInput').forEach(input => {
                if (input.dataset['category'] == newConspectCategory) {
                    addConspectInput = input
                }
            })

            let newConspectName = addConspectInput.value.trim()

            if (addConspectInput == null || newConspectName == '') {
                console.log('incorrect name')
                return
            }
    
            ipcRenderer.invoke('addConspect', newConspectCategory, newConspectName)
            
    
            showAddConspectPanel(false, newConspectCategory)
    
            addConspectButtonClickListener()

            canvas.innerHTML = ''

            
            conspectName.value = selectedConspect.Name = newConspectName
            categoryName.value = selectedConspect.Category = newConspectCategory

            startAutosaveTimer()
        })
    })
}




canvas.addEventListener('input', () => {
    nonSaveIndicator.hidden = false
})



// IPC

ipcRenderer.on('setCanvasData', (e, fileContent) => {
    canvas.innerHTML = fileContent
    conspectName.value = selectedConspect.Name
    categoryName.value = selectedConspect.Category

    startAutosaveTimer()
})

ipcRenderer.on('setNewFileData', (e, fileContent) => {
    stopAutosaveTimer()

    canvas.innerHTML = fileContent
    conspectName.value = selectedConspect.Name = defaultName
    categoryName.value = selectedConspect.Category = defaultCategory
    nonSaveIndicator.hidden = false
})

ipcRenderer.on('categoryDeleted', (e, category) => {
    if (category == selectedConspect.Category) {
        resetSelectedConspect()
    }
})
ipcRenderer.on('conspectDeleted', (e, conspect) => {
    if (conspect == selectedConspect.Name) {
        resetSelectedConspect()
    }
})

ipcRenderer.on('insertImage', (e, imagePath) => {
    document.execCommand('insertImage', false, imagePath)

    const images = canvas.getElementsByTagName('img')
    for (const img of images) {
        img.style.maxWidth = 95 + '%'
    }
})

ipcRenderer.on('justifyLeft', (e) => {
    document.execCommand('justifyLeft', false, null)
})
ipcRenderer.on('justifyCenter', (e) => {
    document.execCommand('justifyCenter', false, null)
})
ipcRenderer.on('justifyRight', (e) => {
    document.execCommand('justifyRight', false, null)
})
ipcRenderer.on('saveConspect', () => {
    ipcRenderer.invoke('saveConspect', selectedConspect.Category, selectedConspect.Name, canvas.innerHTML)
})




// FUNCTIONS

function showAddCategoryPanel(showPanel) {
    if (showPanel) {
        document.getElementById('addCategoryPanel').innerHTML = `
        <div id="addCategory">
            <input id="addCategoryInput"></input>
            <br />
            <div id="addCategoryButtons">
                <button class="addCategoryButton" id="addCategory_SaveButton">Сохранить</button>
                <button class="addCategoryButton" id="addCategory_CancelButton">Отмена</button>
            </div>
        </div>
        `
    } else {
        document.getElementById('addCategoryPanel').innerHTML = `
        <button id="addCategoryButton">
            <i class="fa fa-add"></i>
            <span>Добавить категорию</span>
        </button>
        `
    }
}

function showAddConspectPanel(showPanel, category) {
    if (showPanel) {
        document.querySelectorAll('.addConspectPanel').forEach(panel => {
            if (panel.dataset['category'] == category) {
                panel.innerHTML = `
                <div class="addConspect">
                    <input class="addConspectInput" data-category="${category}"></input>
                    <br />
                    <div class="addConspectButtons">
                        <button class="addConspect_SaveButton" data-category="${category}">Сохранить</button>
                        <button class="addConspect_CancelButton" data-category="${category}">Отмена</button>
                    </div>
                </div>
                `
            }
        })
    } else {
        document.querySelectorAll('.addConspectPanel').forEach(panel => {
            if (panel.dataset['category'] == category) {
                panel.innerHTML = `
                <button class="addConspectButton" data-category="${category}">
                    <i class="fa fa-add"></i>
                    <span>Новый конспект</span>
                </button>
                `
            }
        })
    }
}

function resetSelectedConspect() {
    stopAutosaveTimer()

    conspectName.value = selectedConspect.Name = defaultName
    categoryName.value = selectedConspect.Category = defaultCategory
    canvas.innerHTML = ''
}

function saveConspect() {
    ipcRenderer.invoke('saveConspect', selectedConspect.Category, selectedConspect.Name, canvas.innerHTML)
}
function updateConspect() {
    nonSaveIndicator.hidden = true
    ipcRenderer.invoke('updateConspect', selectedConspect.Category, selectedConspect.Name, canvas.innerHTML)
}

function startAutosaveTimer() {
    stopAutosaveTimer()
    autosaveTimer = setInterval(updateConspect, 1000)
}

function stopAutosaveTimer() {
    clearInterval(autosaveTimer)
}