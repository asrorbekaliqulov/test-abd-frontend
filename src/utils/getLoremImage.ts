export const getLoremImage = (
    width: number = 400,
    height: number = 300
) => {
    const seed = Math.random().toString(36).substring(2, 12)
    return `https://picsum.photos/seed/${seed}/${width}/${height}`
}
