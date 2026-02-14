/**
 * Clipboard utility functions for VeriVote
 */

/**
 * Copy text to clipboard
 * @param text - Text to copy
 * @returns Promise<boolean> - True if successful, false otherwise
 */
export async function copyToClipboard(text: string): Promise<boolean> {
    try {
        await navigator.clipboard.writeText(text)
        return true
    } catch (error) {
        console.error('Failed to copy to clipboard:', error)
        return false
    }
}

/**
 * Truncate a hash for display
 * @param hash - Full hash string
 * @param startLen - Number of characters to show at start (default: 8)
 * @param endLen - Number of characters to show at end (default: 8)
 * @returns Truncated hash (e.g., "ABC12345...XYZ98765")
 */
export function truncateHash(hash: string, startLen = 8, endLen = 8): string {
    if (!hash || hash.length <= startLen + endLen) {
        return hash
    }
    return `${hash.substring(0, startLen)}...${hash.substring(hash.length - endLen)}`
}

/**
 * Truncate an Algorand address for display
 * @param address - Full Algorand address
 * @returns Truncated address (first 6 + last 4)
 */
export function truncateAddress(address: string): string {
    return truncateHash(address, 6, 4)
}
