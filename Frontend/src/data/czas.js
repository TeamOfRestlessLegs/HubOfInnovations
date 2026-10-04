// „5 min temu”, „2 godz. temu”, albo data
export const kiedy = (iso) => {
  const min = Math.round((Date.now() - new Date(iso)) / 6e4)
  if (min < 1) return 'przed chwilą'
  if (min < 60) return `${min} min temu`
  if (min < 1440) return `${Math.round(min / 60)} godz. temu`
  return new Date(iso).toLocaleDateString('pl-PL')
}
