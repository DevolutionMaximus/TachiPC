type SearchOptionButtonType = 'dichip' | 'trichip' | 'search'
type SortValues = 'popular' | 'created' | 'updated'
type FilterValue = {
    name: string,
    type: SearchOptionButtonType,
    value: string,
}
type SortOptions = Array<{
    name: string,
    type: SearchOptionButtonType,
    value: SortValues
}>
type FilterOptions = Array<{
    groupName: string,
    max?: number,
    values: Array<FilterValue>
}>
type SearchOptions = [SortOptions, FilterOptions]
type SortResults = Array<string>
type FilterResults = Array<{
    groupName: string,
    values: Array<string>
}>
type Card = {
    name: string,
    cover: string,
    id: string
}