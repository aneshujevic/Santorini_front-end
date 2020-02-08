import React from 'react';
import axios from 'axios';
import Square from './square';
import Panel from './panel';

const getAvailableMovesURL = "http://127.0.0.1:8000/getAvailableMoves/";
const getMoveMinmaxAiURL = "http://127.0.0.1:8000/minimax/";
const getMoveAlphaBetaAiURL = "http://127.0.0.1:8000/alphaBeta/";
const getMoveAlphaBetaCustomAiURL = "http://127.0.0.1:8000/alphaBetaCustom/";

var gameEnded = false;

class Board extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            cells: Array(25).fill(0),
            firstHE: -1,
            secondHE: -1,
            firstJU: -1,
            secondJU: -1,
            availableMovesOrBuilds: [],
            minNext: true,
        };

        this.buildersSetUp = 0;
        this.serverAiMoveURL = getMoveAlphaBetaCustomAiURL;

        this.whoseMove = "Jupiter's move";

        this.movesCount = 0;
        this.depth = 4;
        this.start = false;
    }

    componentDidMount() {
        if (window.confirm("Start the Skynet?")) {
            this.setUpAIBuilders();
        }
    }

    nextMove() {
        this.doMoveAI(this.serverAiMoveURL, this.depth);
    }

    changeUrl() {
        const alg = document.getElementById("algorithm").value;
        switch (alg) {
            case "minimax":
                this.serverAiMoveURL = getMoveMinmaxAiURL;
                break;
            case "ab":
                this.serverAiMoveURL = getMoveAlphaBetaAiURL;
                break;
            case "ab-enhanced":
                this.serverAiMoveURL = getMoveAlphaBetaCustomAiURL;
                break;
            default:
                this.serverAiMoveURL = getMoveAlphaBetaCustomAiURL;
                break;
        }
        alert("Successfully changed algorithm for AI!");
    }

    canGoDeeper() {
        if (this.movesCount >= 30)
            this.depth = 5;

        if (this.movesCount >= 55)
            this.depth = 6;

        if (this.movesCount >= 70)
            this.depth = 7;
    }

    clickHandle(idOfCell) {
        alert("Game in progress, AI vs AI, you cannot do anything to stop them. >:D");
        return
    }

    doMoveAI(URL, depth) {
        this.checkWin();
        this.changeMoveUI();

        if (gameEnded)
            return;

        this.getAIMoveFromServer(URL, depth)
            .then((resp) => {
                const buildersID = resp.data.id;
                const move = resp.data.move[0] * 5 + resp.data.move[1];
                const build = resp.data.build[0] * 5 + resp.data.build[1];

                let coordinatesMoveFrom;
                switch (buildersID) {
                    case 1:
                        coordinatesMoveFrom = this.state.firstHE;
                        break;
                    case 2:
                        coordinatesMoveFrom = this.state.secondHE;
                        break;
                    case 3:
                        coordinatesMoveFrom = this.state.firstJU;
                        break;
                    case 4:
                        coordinatesMoveFrom = this.state.secondJU;
                        break;
                    default:
                        coordinatesMoveFrom = null;
                }

                this.moveFigure(coordinatesMoveFrom, move);
                this.buildBlock(build);

                this.checkWin();

                this.changeMoveUI();
            });

    };

    async getAIMoveFromServer(url, depth) {
        const cells = this.state.cells.slice().map((x) => {
            if (x >= 9)
                return (x + 1) % 5;
            else if (x >= 5)
                return x % 5;
            else
                return x;
        });

        const data = [{
            cells: cells,
            firstHE: this.state.firstHE,
            secondHE: this.state.secondHE,
            firstJU: this.state.firstJU,
            secondJU: this.state.secondJU,
            minNext: this.state.minNext,
            startPosition: null,
            depth: depth,
        }];

        const response = await axios
            .post(url, data)
            .catch((err) => { console.log(err) });

        return response;
    }

    setUpAIBuilders() {
        let indexes = []
        for (let i = 0; i < 4; ) {
            let newIndex = Math.floor(Math.random() * 24);
            if (indexes.indexOf(newIndex) === -1) {
                indexes.push(newIndex);
                i++;
            }
        }

        let firstHE = indexes[0];
        let firstJU = indexes[1];
        let secondHE = indexes[2];
        let secondJU = indexes[3];


        const cells = this.state.cells.slice();
        cells[firstHE] = 5;
        cells[secondHE] = 5;
        cells[firstJU] = 9;
        cells[secondJU] = 9;

        this.setState({
            firstHE: firstHE,
            secondHE: secondHE,
            firstJU: firstJU,
            secondJU: secondJU,
            cells: cells
        });
    }

    setupAvailableMoves(selectedCoordinate, url) {
        this.getMovesFromServer(selectedCoordinate, url)
            .then((arrayOfMoves) => this.setState({ availableMovesOrBuilds: arrayOfMoves }));
    }

    async getMovesFromServer(selectedCoordinate, url) {
        const cells = this.state.cells.slice().map((x) => {
            if (x >= 9)
                return (x + 1) % 5;
            else if (x >= 5)
                return x % 5;
            else
                return x;
        });

        const data = [{
            cells: cells,
            firstHE: this.state.firstHE,
            secondHE: this.state.secondHE,
            firstJU: this.state.firstJU,
            secondJU: this.state.secondJU,
            startPosition: [Math.floor(selectedCoordinate / 5), selectedCoordinate % 5],
            depth: null
        }];

        const response = await axios
            .post(url, data)
            .catch((err) => { console.log(err) });
        return response.data.moves.map(x => x[0] * 5 + x[1]);
    }

    // Moving a figure
    moveFigure(fromCell, toCell, callBackFunction) {
        const multiplier = Math.floor((this.state.cells[fromCell] + 1) / 5);
        const cells = this.state.cells.slice();
        const oldValueOfCell = cells[fromCell];
        cells[fromCell] = oldValueOfCell >= 9 ? (cells[fromCell] + 1) % 5 : cells[fromCell] % 5;
        cells[toCell] = oldValueOfCell >= 9 ? 5 * multiplier + cells[toCell] - 1 : 5 * multiplier + cells[toCell];

        this.setState({
            firstHE: this.state.firstHE === fromCell ? toCell : this.state.firstHE,
            secondHE: this.state.secondHE === fromCell ? toCell : this.state.secondHE,
            firstJU: this.state.firstJU === fromCell ? toCell : this.state.firstJU,
            secondJU: this.state.secondJU === fromCell ? toCell : this.state.secondJU,
            cells: cells,
        }, callBackFunction);

        this.movesCount++;
        this.canGoDeeper();
    }

    // Bulding a block
    buildBlock(onCell) {
        const cells = this.state.cells.slice();
        cells[onCell] += 1;

        this.setState({
            cells: cells,
            minNext: !this.state.minNext
        });
    }

    checkWin() {
        const index = this.state.cells.findIndex(x => x === 12 || x === 8);
        if (index !== -1) {
            switch (this.state.cells[index]) {
                case 8:
                    alert("Hercules won!");
                    break;
                case 12:
                    alert("Jupiter won!");
                    break;
                default:
                    break;
            }
            gameEnded = true;

            if (window.confirm("Do you want to play another game?")) {
                window.location.reload();
            }
            return;
        }

        let firstJU = this.state.firstJU;
        let secondJU = this.state.secondJU;
        let firstHE = this.state.firstHE;
        let secondHE = this.state.secondHE;

        if (this.getMovesFromServer(firstJU, getAvailableMovesURL).length === 0 && this.getMovesFromServer(secondJU, getAvailableMovesURL).length === 0) {
            gameEnded = true;
            alert("Hercules won!");
        } else if (this.getMovesFromServer(firstHE, getAvailableMovesURL).length === 0 && this.getMovesFromServer(secondHE, getAvailableMovesURL).length === 0) {
            gameEnded = true;
            alert("Jupiter won!");
        }

        if (gameEnded) {
            if (window.confirm("Do you want to play another game?")) {
                window.location.reload();
            }
        }
    }

    incDepth() {
        this.depth++;
        this.updateDepthUI();
    }

    decDepth() {
        if (this.depth === 1)
            return;

        this.depth--;
        this.updateDepthUI();
    }

    updateDepthUI() {
        const depthSpan = document.getElementById("graph-depth");
        depthSpan.textContent = this.depth;
    }

    changeMoveUI() {
        switch (this.state.minNext) {
            case false:
                this.whoseMove = "Hercules's move";
                break;
            case true:
                this.whoseMove = "Jupiter's move";
                break;
            default:
                return;
        }

        document.getElementsByClassName("who-move")[0].textContent = this.whoseMove;
    }

    render() {
        const sources = this.state.cells.map((square) => this.getImageSourceCell(square));
        return (
            <div className="main-div">
                <Panel side="left" class="left-panel" />

                <div className="board">
                    <div className="board-row">
                        {this.renderSquare(sources[0], 0)}
                        {this.renderSquare(sources[1], 1)}
                        {this.renderSquare(sources[2], 2)}
                        {this.renderSquare(sources[3], 3)}
                        {this.renderSquare(sources[4], 4)}
                    </div>
                    <div className="board-row">
                        {this.renderSquare(sources[5], 5)}
                        {this.renderSquare(sources[6], 6)}
                        {this.renderSquare(sources[7], 7)}
                        {this.renderSquare(sources[8], 8)}
                        {this.renderSquare(sources[9], 9)}
                    </div>
                    <div className="board-row">
                        {this.renderSquare(sources[10], 10)}
                        {this.renderSquare(sources[11], 11)}
                        {this.renderSquare(sources[12], 12)}
                        {this.renderSquare(sources[13], 13)}
                        {this.renderSquare(sources[14], 14)}
                    </div>
                    <div className="board-row">
                        {this.renderSquare(sources[15], 15)}
                        {this.renderSquare(sources[16], 16)}
                        {this.renderSquare(sources[17], 17)}
                        {this.renderSquare(sources[18], 18)}
                        {this.renderSquare(sources[19], 19)}
                    </div>
                    <div className="board-row">
                        {this.renderSquare(sources[20], 20)}
                        {this.renderSquare(sources[21], 21)}
                        {this.renderSquare(sources[22], 22)}
                        {this.renderSquare(sources[23], 23)}
                        {this.renderSquare(sources[24], 24)}
                    </div>
                    <button onClick={() => this.nextMove()} className="who-move">{this.whoseMove} [CLICK TO BEGIN]</button>
                </div>
                <Panel
                    side="right"
                    algorithmFun={() => this.changeUrl()}
                    increaseFun={() => this.incDepth()}
                    decreaseFun={() => this.decDepth()}
                    class="right-panel"
                />
            </div>
        );
    }

    // Choosing a path for the image source for the appropriate value
    getImageSourceCell(i) {
        switch (i) {
            case 0:
                return "lvl_0.jpg";
            case 1:
                return "lvl_1.png";
            case 2:
                return "lvl_2.png";
            case 3:
                return "lvl_3.png";
            case 4:
                return "lvl_4.png";
            case 5:
                return "hercules.png";
            case 6:
                return "lvl_1_HE.png";
            case 7:
                return "lvl_2_HE.png";
            case 8:
                return "lvl_3_HE.png";
            case 9:
                return "jupiter.png";
            case 10:
                return "lvl_1_JU.png";
            case 11:
                return "lvl_2_JU.png";
            case 12:
                return "lvl_3_JU.png";
            default:
                return "";
        }
    }

    renderSquare(source, idOfCell) {
        const glowing = this.state.availableMovesOrBuilds?.find(x => x === idOfCell) != null ? true : false;
        return (
            <Square
                src={`../images/${source}`}
                onClick={() => this.clickHandle(idOfCell)}
                glowing={glowing}
            />
        );
    }
}

export default Board;
