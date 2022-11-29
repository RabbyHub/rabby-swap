export const isSameAddress = (addr1: string, addr2: string) => {
  if (typeof addr1 !== 'string' || typeof addr2 !== 'string') return false;
  return addr1.toLowerCase() === addr2.toLowerCase();
}
