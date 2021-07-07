import { ipcMain } from 'electron'
import axios from 'axios'
import { AxiosError } from 'axios'
import Store from '../../config'
import path from 'path'

//TODO: logging

enum PublicationDemographic {
    SHOUNEN = 'shounen',
    SHOUJO = 'shoujo',
    JOSEI = 'josei',
    SEINEN = 'seinen',
    NONE = 'none'
}

enum Status {
    ONGOING = 'ongoing',
    COMPLETED = 'completed',
    HIATUS = 'hiatus',
    CANCELLED = 'cancelled'
}

enum ContentRating {
    SAFE = 'safe',
    SUGGESTIVE = 'suggestive',
    EROTICA = 'erotica',
    PORNOGRAPHIC = 'pornographic',
    NONE = 'none'
}

enum TagsMode {
    AND = 'AND',
    OR = 'OR'
}



type AuthLoginResponse = {
    result: string,
    token: {
        session: string,
        refresh: string
    }
}

type AuthCheckResponse = {
    result: string,
    isAuthenticated: boolean
    roles: Array<string>,
    permissions: Array<string>
}

type AuthRefreshResponse = {
    result: string,
    token: {
        session: string,
        refresh: string
    },
    message: string
}

type MangadexError = {
    result: string,
    errors: Array<{
        id: string,
        status: number,
        title: string,
        detail: string
    }>
}

type MangaListOptions = {
    limit: number,
    offset: number, 
    title: string,
    authors: Array<string>,
    artists: Array<string>,
    year: number,
    includedTags: Array<string>
}

type TagEntry = {
    id: string,

}

const mangadexInstance = axios.create({
    baseURL: 'https://api.mangadex.org/',

})

const mangadexConfigDefaults = {
    refreshToken: '',
    sessionToken: '',
    username: '',
    tags: []
}

const mangadexUserConfigDefaults = {
    contentRating: [
        ContentRating.SAFE,
        ContentRating.SUGGESTIVE
    ],
    locale: 'en',
    mangaLimit: 30,
    chapterLimit: 100,
}

const mangadexStore = new Store(path.join('extensions', 'mangadex', 'config'), mangadexConfigDefaults)
const mangadexUserStore = new Store(path.join('extensions', 'mangadex', 'userConfig'), mangadexUserConfigDefaults)

const handleError = (event: Electron.IpcMainEvent, error: unknown|AxiosError) => {
    if (axios.isAxiosError(error)) {
        if (error.response.data && error.response.data.errors) {
            let replyObject = {
                status: error.response.status,
                details: error.response.data.errors[0].details
            }
            event.reply('error', 'MangaDex', replyObject)
        }
        else if (error.response) {
            let replyObject = {
                status: error.response.status,
                details: 'Unknown Error'
            }
            event.reply('error', 'MangaDex', replyObject)
        }
    }
    else {
        let replyObject = {
            status: -1,
            details: 'Unknown Error'
        }
        console.error(error)
        event.reply('error', 'MangaDex', replyObject)
    }
}

const login = async (username: string, password: string) => {
    let response = await axios.post('/auth/login', {
            'username': username,
            'password': password
        })
    let data: AuthLoginResponse = response.data
    mangadexStore.set('sessionToken', data.token.session)
    mangadexStore.set('refreshToken', data.token.refresh)
    mangadexInstance.defaults.headers.common['Authorization'] = `Bearer ${data.token.session}`
}

const isAuthenticated = async () => {
    let response = await axios.get('/auth/check')
    let data: AuthCheckResponse = response.data
    return data.isAuthenticated
}

const logout = async () => {
    let response = await axios.post('/auth/logout')
}

const refreshToken = async () => {
    let response = await axios.post('/auth/refresh', {
        'token': mangadexStore.get('refreshToken')
    })
    let data: AuthRefreshResponse = response.data
    mangadexStore.set('sessionToken', data.token.session)
    mangadexStore.set('refreshToken', data.token.refresh)
}

const initTags = async () => {

}

const getMangaList = async (options: MangaListOptions) => {

}
