import { ethers } from 'ethers';

const ABI = [
  'event Anchored(bytes32 indexed hash, address indexed submitter, uint256 timestamp)',
  'function anchor(bytes32 hash) external',
];

export async function anchorHash(hexHash: string) {
  const rpcUrl = process.env.RPC_URL!;
  const pk = process.env.PRIVATE_KEY!;
  const contractAddress = process.env.CONTRACT_ADDRESS!;

  if (!rpcUrl || !pk || !contractAddress) {
    throw new Error('Missing RPC_URL / PRIVATE_KEY / CONTRACT_ADDRESS');
  }
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const wallet = new ethers.Wallet(pk, provider);
  const contract = new ethers.Contract(contractAddress, ABI, wallet);
  const tx = await contract.anchor(hexHash as `0x${string}`);
  const receipt = await tx.wait();
  return { txHash: receipt.hash, blockNumber: receipt.blockNumber };
}
