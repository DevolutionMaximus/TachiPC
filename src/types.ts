type SearchOptionType = 'dropdown' | 'dichip' | 'trichip'
type SearchOptions = Array<{
    name: string,
    type: SearchOptionType,
    values: Array<{
        id: string,
        name: string
    }>
}>
type MangaType = {
    id: string,
    title: string,
    img: string,
    
}