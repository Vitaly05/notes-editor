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

ipcRenderer.on('fileOpen', (e, fileContent) => {
    canvas.innerHTML = fileContent
})










class NavigationPanel {
    constructor() {
        this.categories = []
    }

    addCategory(category) {
        this.categories.push(category)
    }

    getHtml() {
        return `<ul id="categories">${this.getCategoriesHtml()}</ul>`
    }

    getCategoriesHtml() {
        let html = ''
        this.categories.forEach(category => {
            html += category.getHtml()
        })
        return html
    }

    logg() {
        console.log(this.categories)
    }
}
class Category {
    constructor(name) {
        this.name = name
        this.conspects = []
    }
    addConspect(conspect) {
        this.conspects.push(conspect)
    }
    getHtml() {
        return `<li class="category">${this.name}<ul class="conspects">${this.getConspectsHtml()}</ul></li>`
    }
    getConspectsHtml() {
        let html = ''
        this.conspects.forEach(conspect => {
            html += conspect.getHtml()
        })
        return html
    }
}
class Conspect {
    constructor(name) {
        this.name = name
    }
    getHtml() {
        return `<li class="conspect">${this.name}</li>`
    }
}

let navigationPanel = document.getElementById('navigationPanel')

let navigation = new NavigationPanel()

let category1 = new Category('category1')
category1.addConspect(new Conspect('conspect1-1'))
category1.addConspect(new Conspect('conspect1-2'))
navigation.addCategory(category1)

let category2 = new Category('category2')
category2.addConspect(new Conspect('conspect2-1'))
category2.addConspect(new Conspect('conspect2-2'))
navigation.addCategory(category2)

navigationPanel.innerHTML = navigation.getHtml()