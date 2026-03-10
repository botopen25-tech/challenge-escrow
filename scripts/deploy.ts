import hre from 'hardhat';

const { ethers } = hre;

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log('Deployer:', deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log('Balance:', ethers.formatEther(balance), 'ETH');

  const MockUSDC = await ethers.getContractFactory('MockUSDC');
  const mockUsdc = await MockUSDC.deploy();
  await mockUsdc.waitForDeployment();
  const mockUsdcAddress = await mockUsdc.getAddress();
  console.log('MockUSDC:', mockUsdcAddress);

  const ChallengeEscrow = await ethers.getContractFactory('ChallengeEscrow');
  const escrow = await ChallengeEscrow.deploy();
  await escrow.waitForDeployment();
  const escrowAddress = await escrow.getAddress();
  console.log('ChallengeEscrow:', escrowAddress);

  console.log('\nVercel env:');
  console.log(`NEXT_PUBLIC_CHAIN_ID=84532`);
  console.log(`NEXT_PUBLIC_CHALLENGE_ESCROW_ADDRESS=${escrowAddress}`);
  console.log(`NEXT_PUBLIC_USDC_ADDRESS=${mockUsdcAddress}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
