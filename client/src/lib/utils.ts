
export const formatMessageTime = (date: Date | string | number): string => {
    return new Date(date).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false })
}
