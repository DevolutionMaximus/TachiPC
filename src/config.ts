import { remote, app } from 'electron'
import path from 'path'
import fs from 'fs'

class Store {
    private storeData
    private storePath

    constructor (storeName: string, defaults: Object) {
        const userDataPath = (app || remote.app).getPath('userData')
        this.storePath = path.join(userDataPath, storeName + '.json')
        this.storeData = this.getStoreFromFile(this.storePath, defaults)
    }

    private getStoreFromFile(storePath: string, defaults: Object) {
        try {
            return JSON.parse(fs.readFileSync(storePath).toString())
        }
        catch (error) {
            return defaults
        }
    }

    get (key: string) {
        return this.storeData[key]
    }

    set (key: string, value: string|number|Object) {
        this.storeData[key] = value
        try {
            fs.writeFileSync(this.storePath, JSON.stringify(this.storeData))
        } catch (error) {
            console.error(error)
        }
        
    }
}

export default Store