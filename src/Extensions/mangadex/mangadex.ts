import { ipcMain } from 'electron'
import axios, { AxiosInstance, AxiosError } from 'axios'
import Store from '../../config'
import path from 'path'
import Bottleneck from 'bottleneck'

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

enum ResultEnum {
    OK = 'ok',
    ERROR = 'error'
}

enum OrderEnum {
    ASCENDING = 'asc',
    DESCENDING = 'desc'
}

enum TypeEnum {
    MANGA = 'manga',
    CHAPTER = 'chapter',
    COVER_ART = 'cover_art',
    AUTHOR = 'author',
    ARTIST = 'artist',
    SCANLATION_GROUP = 'scanlation_group',
    TAG = 'tag',
    USER = 'user',
    CUSTOM_LIST = 'custom_list'
}

enum KnownOriginalLanguages {
    JAPANESE = 'ja',
    KOREAN = 'ko',
    CHINESE = 'zh'
}

type Relationship = {
    id: string,
    type: TypeEnum,
    attributes?: Object
}

type AuthLoginResponse = {
    result: ResultEnum,
    token: {
        session: string,
        refresh: string
    }
}

type AuthCheckResponse = {
    result: ResultEnum,
    isAuthenticated: boolean
    roles: Array<string>,
    permissions: Array<string>
}

type AuthRefreshResponse = {
    result: ResultEnum,
    token: {
        session: string,
        refresh: string
    },
    message: string
}

type LocalizedString = {
    [locale: string]: string
}

type TagAttributes = {
    name: LocalizedString,
    description: LocalizedString,
    group: string,
    version: number
}

type Tag = {
    id: string,
    type: TypeEnum,
    attributes: TagAttributes
}

type TagResponse = Array<{
    result: ResultEnum,
    data: Tag,
    relationships: Array<Relationship>
}>

type MangaAttributes = {
    title: LocalizedString,
    altTitles: Array<LocalizedString>,
    description: LocalizedString,
    isLocked: boolean,
    links: {
        [link: string]: string
    },
    originalLanguage: string,
    lastVolume: string | null,
    lastChapter: string | null,
    publicationDemographic: PublicationDemographic | null,
    status: Status | null,
    year: number | null,
    contentRating: ContentRating | null,
    tags: Array<Tag>,
    version: number,
    createdAt: string,
    updatedAt: string
}

type Manga = {
    id: string,
    type: TypeEnum,
    attributes: MangaAttributes,
}

type MangaResponse = {
    result: ResultEnum,
    data: Manga,
    relationships: Array<Relationship>
}

type MangaListResponse = {
    results: Array<MangaResponse>,
    limit: number,
    offset: number,
    total: number
}

type CoverAttributes = {
    volume: string | null,
    fileName: string,
    description: string | null,
    version: number,
    createdAt: string,
    updatedAt: string
}

type Cover = {
    id: string,
    type: TypeEnum,
    attributes: CoverAttributes
}

type CoverResponse = {
    result: ResultEnum,
    data: Cover,
    relationships: Array<Relationship>
}

type CoverListResponse = {
    results: Array<CoverResponse>,
    limit: number,
    offset: number,
    total: number
}

type ChapterAttributes = {
    title: string,
    volume: string | null,
    chapter: string | null,
    translatedLanguage: string,
    hash: string,
    data: Array<string>,
    dataSaver: Array<string>,
    uploader: string,
    version: number,
    createdAt: string,
    updatedAt: string,
    publishAt: string
}

type Chapter = {
    id: string,
    type: TypeEnum,
    attributes: ChapterAttributes
}

type ChapterResponse = {
    result: ResultEnum,
    data: Chapter,
    relationships: Array<Relationship>
}

type ChapterListResponse = {
    results: Array<ChapterResponse>,
    limit: number,
    offset: number,
    total: number
}

type MangadexError = {
    result: ResultEnum,
    errors: Array<{
        id: string,
        status: number,
        title: string,
        detail: string
    }>
}

enum MangaIncludes {
    AUTHOR = 'author',
    COVER_ART = 'cover_art',
    ARTIST = 'artist'
}

type MangaListOptions = {
    limit: number,
    offset: number, 
    title: string,
    authors: Array<string>,
    artists: Array<string>,
    year: number,
    includedTags: Array<string>,
    includedTagsMode: TagsMode,
    excludedTags: Array<string>,
    status: Array<Status>,
    originalLanguage: KnownOriginalLanguages,
    publicationDemographic: Array<PublicationDemographic>,
    ids: Array<string>,
    contentRating: Array<ContentRating>,
    createdAtSince: string,
    updatedAtSince: string,
    order: {
        createdAt: OrderEnum,
        updatedAt: OrderEnum
    },
    includes: Array<MangaIncludes>
}

enum ChapterIncludes {
    SCANLATION_GROUP = 'scanlation_group',
    MANGA = 'manga',
    USER = 'user'
}

type ChapterListOptions = {
    limit: number,
    offset: number,
    ids: Array<string>,
    title: string,
    groups: Array<string>,
    uploader: string,
    manga: string,
    volume: string | Array<string>,
    chapter: string | Array<string>,
    translatedLanguage: Array<string>,
    createdAtSince: string,
    updatedAtSince: string,
    publishAtSince: string,
    order: {
        createdAt: OrderEnum,
        updatedAt: OrderEnum,
        publishAt: OrderEnum,
        volume: OrderEnum,
        chapter: OrderEnum
    },
    includes: Array<ChapterIncludes>
}

type TagEntry = {
    id: string,
    name: string,
    group: string
}

const mangadexConfigDefaults = {
    refreshToken: '',
    username: '',
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
const mangadexInstance = axios.create({
    baseURL: 'https://api.mangadex.org/',
})
const globalLimiter = new Bottleneck({
    maxConcurrent: 5,
    minTime: 200
})
let tagList: Array<TagEntry>
let isAuthenticated = false
let sessionToken = ''
let initErrors: Array<{ status: number, details: string }>

const init = async () => {
    const token = mangadexStore.get('refreshToken')
    if (token && token.length > 0) {
        try {
            await refreshSessionToken()
            isAuthenticated = true
        }
        catch (error: unknown|AxiosError) {
            if (axios.isAxiosError(error)) {
                if (error.response) {
                    if (error.response.status == 401 || error.response.status == 403) {
                        isAuthenticated = false
                    }
                    else {
                        initErrors.push({
                            status: error.response.status,
                            details: 'Unable to contact authentication servers. Login required'
                        })
                        isAuthenticated = false
                    }
                }
                else {
                    initErrors.push({
                        status: -1,
                        details: 'Unknown Axios error during initialization'
                    })
                    console.error(error)
                    isAuthenticated = false
                }
            }
            else {
                initErrors.push({
                    status: -1,
                    details: 'Unknown error during initialization'
                })
                console.error(error)
                isAuthenticated = false
            }
        }
    }
    else {
        isAuthenticated = false
    }
    try {
        await initTags()
    }
    catch (error: unknown|AxiosError) {
        if(axios.isAxiosError(error)) {
            if(error.response) {
                initErrors.push({
                    status: error.response.status,
                    details: 'Unable to get taglist'
                })
            }
            else {
                initErrors.push({
                    status: -1,
                    details: 'Unknown Axios error during initialization'
                })
                console.error(error)
            }
        }
        else {
            initErrors.push({
                status: -1,
                details: 'Unknown error during initialization'
            })
            console.error(error)
        }
    }
    
    
}

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
        else {
            let replyObject = {
                status: -1,
                details: 'Unknown Axios Error'
            }
            console.error(error)
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
    let response = await globalLimiter.schedule(() => axios.post('/auth/login', {
            'username': username,
            'password': password
        }))
    let data: AuthLoginResponse = response.data
    sessionToken = data.token.session
    mangadexStore.set('refreshToken', data.token.refresh)
    mangadexInstance.defaults.headers.common['Authorization'] = `Bearer ${sessionToken}`
}

const checkAuthentication = async () => {
    let response = await globalLimiter.schedule(() => axios.get('/auth/check'))
    let data: AuthCheckResponse = response.data
    return data.isAuthenticated
}

const logout = async () => {
    let response = await globalLimiter.schedule(() => axios.post('/auth/logout'))
}

const refreshSessionToken = async () => {
    let response = await globalLimiter.schedule(() => axios.post('/auth/refresh', {
        'token': mangadexStore.get('refreshToken')
    }))
    let data: AuthRefreshResponse = response.data
    sessionToken = data.token.session
    mangadexStore.set('refreshToken', data.token.refresh)
    mangadexInstance.defaults.headers.common['Authorization'] = `Bearer ${sessionToken}`
}

const initTags = async () => {
    let response = await globalLimiter.schedule(() => axios.get('/manga/tag'))
    let data: TagResponse = response.data
    for (let i = 0; i < data.length; i++) {
        tagList.push({
            id: data[i].data.id,
            name: data[i].data.attributes.name.en,
            group: data[i].data.attributes.group
        })
    }
}

const getLoginStatus = () => {
    return isAuthenticated
}

const getMangaList = async (options: MangaListOptions) => {

}
