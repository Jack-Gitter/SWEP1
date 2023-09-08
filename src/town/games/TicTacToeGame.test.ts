import { createPlayerForTesting } from '../../TestUtils';
import InvalidParametersError, {
  GAME_FULL_MESSAGE,
  PLAYER_ALREADY_IN_GAME_MESSAGE,
  PLAYER_NOT_IN_GAME_MESSAGE,
} from '../../lib/InvalidParametersError';
import Player from '../../lib/Player';
import { TicTacToeMove } from '../../types/CoveyTownSocket';
import TicTacToeGame from './TicTacToeGame';

describe('TicTacToeGame', () => {
  let game: TicTacToeGame;

  beforeEach(() => {
    game = new TicTacToeGame();
  });

  describe('[T1.1] _join', () => {
    describe('When the player can be added', () => {
      it('makes the first player X and initializes the state with status WAITING_TO_START', () => {
        const player = createPlayerForTesting();
        game.join(player);
        expect(game.state.x).toEqual(player.id);
        expect(game.state.o).toBeUndefined();
        expect(game.state.moves).toHaveLength(0);
        expect(game.state.status).toEqual('WAITING_TO_START');
        expect(game.state.winner).toBeUndefined();
      });
      it('makes the second player O and initializes the stae with status IN_PROGRESS', () => {
        const player1 = createPlayerForTesting();
        const player2 = createPlayerForTesting();

        game.join(player1);

        expect(game.state.x).toEqual(player1.id);
        expect(game.state.o).toBeUndefined();
        expect(game.state.status).toEqual('WAITING_TO_START');

        game.join(player2);

        expect(game.state.o).toEqual(player2.id);
        expect(game.state.status === 'IN_PROGRESS');
      });
      it('makes sure the same player cannot join the game twice', () => {
        const player = createPlayerForTesting();

        game.join(player);
        expect(() => game.join(player)).toThrow(InvalidParametersError);
        expect(() => game.join(player)).toThrow(PLAYER_ALREADY_IN_GAME_MESSAGE);
      });
      it('makes sure that a player cannot join the game if it is full', () => {
        const player1 = createPlayerForTesting();
        const player2 = createPlayerForTesting();
        const player3 = createPlayerForTesting();

        game.join(player1);
        game.join(player2);

        expect(() => game.join(player3)).toThrow(InvalidParametersError);
        expect(() => game.join(player3)).toThrow(GAME_FULL_MESSAGE);
      });
    });
    describe('[T1.2] _leave', () => {
      describe('when the player is in the game', () => {
        describe('when the game is in progress, it should set the game status to OVER and declare the other player the winner', () => {
          test('when x leaves', () => {
            const player1 = createPlayerForTesting();
            const player2 = createPlayerForTesting();

            game.join(player1);
            game.join(player2);

            expect(game.state.x).toEqual(player1.id);
            expect(game.state.o).toEqual(player2.id);

            game.leave(player1);

            expect(game.state.status).toEqual('OVER');
            expect(game.state.winner).toEqual(player2.id);
            expect(game.state.moves).toHaveLength(0);
            expect(game.state.x).toEqual(player1.id); // this is intentional???
            expect(game.state.o).toEqual(player2.id);
          });
          test('when o leaves', () => {
            const player1 = createPlayerForTesting();
            const player2 = createPlayerForTesting();

            game.join(player1);
            game.join(player2);

            expect(game.state.x).toEqual(player1.id);
            expect(game.state.o).toEqual(player2.id);

            game.leave(player2);

            expect(game.state.status).toEqual('OVER');
            expect(game.state.winner).toEqual(player1.id);
            expect(game.state.moves).toHaveLength(0);
            expect(game.state.x).toEqual(player1.id);
            expect(game.state.o).toEqual(player2.id);
          });
        });
        describe('when the game is not in progress it should remove the player and set status to WAITING_TO_START', () => {
          test('when only player leaves', () => {
            const player = createPlayerForTesting();
            game.join(player);
            expect(game.state.x).toEqual(player.id);
            expect(game.state.status).toEqual('WAITING_TO_START');
            game.leave(player);
            expect(game.state.status).toEqual('WAITING_TO_START');
            expect(game.state.x).toEqual(player.id); // how to test that the player is not in the game???
          });
        });
      });
      describe('when the player is not in the game', () => {
        test('when the game is in progress and player not in game tries to leave', () => {
          const player1 = createPlayerForTesting();
          const player2 = createPlayerForTesting();
          const player3 = createPlayerForTesting();
          game.join(player1);
          game.join(player2);
          expect(() => game.leave(player3)).toThrow(InvalidParametersError);
          expect(() => game.leave(player3)).toThrow(PLAYER_NOT_IN_GAME_MESSAGE);
        });
        test('when the game is not in progress and player not in game tries to leave', () => {
          const player1 = createPlayerForTesting();
          const player2 = createPlayerForTesting();
          game.join(player1);
          expect(game.state.status === 'WAITING_TO_START');
          expect(() => game.leave(player2)).toThrow(InvalidParametersError);
          expect(() => game.leave(player2)).toThrow(PLAYER_NOT_IN_GAME_MESSAGE);
        });
      });
    });
    describe('applyMove', () => {
      describe('when given a valid move', () => {
        let player1: Player;
        let player2: Player;
        beforeEach(() => {
          player1 = createPlayerForTesting();
          player2 = createPlayerForTesting();
          game.join(player1);
          game.join(player2);
        });
        it('[T2.1] should add the move to the game state', () => {
          const move: TicTacToeMove = { row: 1, col: 2, gamePiece: 'X' };
          game.applyMove({
            gameID: game.id,
            playerID: player1.id,
            move,
          });
          expect(game.state.moves).toHaveLength(1);
          expect(game.state.moves[0]).toEqual(move);
          expect(game.state.status).toEqual('IN_PROGRESS');
        });
      });
    });
  });
});
