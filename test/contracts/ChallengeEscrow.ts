import { expect } from 'chai';
import hre from 'hardhat';

const { ethers } = hre;

describe('ChallengeEscrow', function () {
  async function deployFixture() {
    const [creator, opponent, stranger] = await ethers.getSigners();
    const usdc = await ethers.deployContract('MockUSDC');
    const escrow = await ethers.deployContract('ChallengeEscrow');

    const mintAmount = 1_000_000_000n;
    await usdc.mint(creator.address, mintAmount);
    await usdc.mint(opponent.address, mintAmount);

    await usdc.connect(creator).approve(await escrow.getAddress(), mintAmount);
    await usdc.connect(opponent).approve(await escrow.getAddress(), mintAmount);

    return { creator, opponent, stranger, usdc, escrow };
  }

  async function createAcceptedWager() {
    const fixture = await deployFixture();
    const { creator, opponent, usdc, escrow } = fixture;
    await escrow
      .connect(creator)
      .createWager(opponent.address, await usdc.getAddress(), 100_000_000n, 24 * 60 * 60, 'Push-up challenge', 'Most reps wins');
    await escrow.connect(opponent).acceptWager(1);
    return fixture;
  }

  it('creates and accepts a wager with matching deposits', async function () {
    const { creator, opponent, usdc, escrow } = await deployFixture();

    await expect(
      escrow
        .connect(creator)
        .createWager(opponent.address, await usdc.getAddress(), 25_000_000n, 24 * 60 * 60, '5k race', 'Fastest time wins')
    )
      .to.emit(escrow, 'WagerCreated')
      .withArgs(1, creator.address, opponent.address, await usdc.getAddress(), 25_000_000n, 24 * 60 * 60, '5k race');

    const wager = await escrow.getWager(1);
    expect(wager.creator).to.equal(creator.address);
    expect(wager.opponent).to.equal(opponent.address);
    expect(wager.stake).to.equal(25_000_000n);
    expect(wager.status).to.equal(1);

    await expect(escrow.connect(opponent).acceptWager(1)).to.emit(escrow, 'WagerAccepted').withArgs(1, opponent.address);
    expect(await usdc.balanceOf(await escrow.getAddress())).to.equal(50_000_000n);
  });

  it('resolves when both parties confirm the same winner', async function () {
    const { creator, opponent, usdc, escrow } = await createAcceptedWager();
    const creatorStart = await usdc.balanceOf(creator.address);

    await escrow.connect(creator).confirmWinner(1, creator.address);
    await expect(escrow.connect(opponent).confirmWinner(1, creator.address))
      .to.emit(escrow, 'WagerResolved')
      .withArgs(1, creator.address, 200_000_000n);

    const wager = await escrow.getWager(1);
    expect(wager.status).to.equal(3);
    expect(await usdc.balanceOf(creator.address)).to.equal(creatorStart + 200_000_000n);
  });

  it('refunds when both parties mark a tie', async function () {
    const { creator, opponent, usdc, escrow } = await createAcceptedWager();
    const creatorBefore = await usdc.balanceOf(creator.address);
    const opponentBefore = await usdc.balanceOf(opponent.address);

    await escrow.connect(creator).confirmTie(1);
    await expect(escrow.connect(opponent).confirmTie(1)).to.emit(escrow, 'WagerRefunded').withArgs(1);

    const wager = await escrow.getWager(1);
    expect(wager.status).to.equal(4);
    expect(await usdc.balanceOf(creator.address)).to.equal(creatorBefore + 100_000_000n);
    expect(await usdc.balanceOf(opponent.address)).to.equal(opponentBefore + 100_000_000n);
  });

  it('moves to dispute when winner votes conflict', async function () {
    const { creator, opponent, escrow } = await createAcceptedWager();

    await escrow.connect(creator).confirmWinner(1, creator.address);
    await expect(escrow.connect(opponent).confirmWinner(1, opponent.address))
      .to.emit(escrow, 'WagerDisputed')
      .withArgs(1, opponent.address);

    const wager = await escrow.getWager(1);
    expect(wager.status).to.equal(5);
  });

  it('allows creator to refund if nobody accepts before timeout', async function () {
    const { creator, opponent, usdc, escrow } = await deployFixture();

    await escrow
      .connect(creator)
      .createWager(opponent.address, await usdc.getAddress(), 100_000_000n, 3600, 'Chess', 'Best of three');

    await ethers.provider.send('evm_increaseTime', [3601]);
    await ethers.provider.send('evm_mine', []);

    const balanceBefore = await usdc.balanceOf(creator.address);
    await expect(escrow.connect(creator).claimTimeoutRefund(1)).to.emit(escrow, 'WagerRefunded').withArgs(1);
    expect(await usdc.balanceOf(creator.address)).to.equal(balanceBefore + 100_000_000n);
  });

  it('refunds both sides after acceptance timeout', async function () {
    const { creator, opponent, usdc, escrow } = await createAcceptedWager();

    await ethers.provider.send('evm_increaseTime', [24 * 60 * 60 + 1]);
    await ethers.provider.send('evm_mine', []);

    const creatorBefore = await usdc.balanceOf(creator.address);
    const opponentBefore = await usdc.balanceOf(opponent.address);
    await expect(escrow.connect(creator).claimTimeoutRefund(1)).to.emit(escrow, 'WagerRefunded').withArgs(1);
    expect(await usdc.balanceOf(creator.address)).to.equal(creatorBefore + 100_000_000n);
    expect(await usdc.balanceOf(opponent.address)).to.equal(opponentBefore + 100_000_000n);
  });

  it('supports explicit dispute escalation after timeout', async function () {
    const { creator, escrow } = await createAcceptedWager();

    await ethers.provider.send('evm_increaseTime', [24 * 60 * 60 + 1]);
    await ethers.provider.send('evm_mine', []);

    await expect(escrow.connect(creator).escalateDispute(1)).to.emit(escrow, 'WagerDisputed').withArgs(1, creator.address);
    const wager = await escrow.getWager(1);
    expect(wager.status).to.equal(5);
  });

  it('rejects unauthorized actors', async function () {
    const { creator, opponent, stranger, usdc, escrow } = await deployFixture();

    await escrow
      .connect(creator)
      .createWager(opponent.address, await usdc.getAddress(), 100_000_000n, 24 * 60 * 60, 'Hoops', 'First to 21');

    await expect(escrow.connect(stranger).acceptWager(1)).to.be.revertedWithCustomError(escrow, 'Unauthorized');
    await escrow.connect(opponent).acceptWager(1);
    await expect(escrow.connect(stranger).confirmWinner(1, creator.address)).to.be.revertedWithCustomError(escrow, 'Unauthorized');
  });
});
