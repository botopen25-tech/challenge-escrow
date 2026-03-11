export function baseSepoliaTxUrl(hash?: string) {
  return hash ? `https://sepolia.basescan.org/tx/${hash}` : '';
}

export function baseSepoliaAddressUrl(address?: string) {
  return address ? `https://sepolia.basescan.org/address/${address}` : '';
}
