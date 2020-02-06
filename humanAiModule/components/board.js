import React from 'react';
import axios from 'axios';
import Square from './square';
import Panel from './panel';

const getAvailableMovesURL = "http://127.0.0.1:8000/getAvailableMoves/";
const getAvailableBuildsURL = "http://127.0.0.1:8000/getAvailableBuilds/";
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
            humanNext: true,
        };
        // arguable vvvvvvvvvvvvvvvvvv
        this.humanPlayer = props.human;
        this.chooseMove = false;
        this.moving = false;
        this.building = false;
        this.buildersSetUp = 0;
        this.lastClickedId = -1;
        this.serverAiMoveURL = getMoveAlphaBetaCustomAiURL;

        // values from 9 to 12 belong to Jupiter 
        this.upperBoundCellValue = 12;
        this.lowerBoundCellValue = 9;
        this.movesCount = 0;
        this.depth = 4;
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

    checkWin() {
        const index = this.state.cells.findIndex(x => x === 12 || x === 8);
        if (index !== -1) {
            switch (this.state.cells[index]) {
                case 8:
                    alert("AI won!");
                    break;
                case 12:
                    alert("Human won!");
                    break;
                default:
                    break;
            }
            gameEnded = true;

            if (window.confirm("Do you want to play another game?")) {
                window.location.reload();
            }
        }

        let firstJU = this.state.firstJU;
        let secondJU = this.state.secondJU;
        let firstHE = this.state.firstHE;
        let secondHE = this.state.secondHE;

        if (this.getMovesFromServer(firstJU, getAvailableMovesURL).length === 0 && this.getMovesFromServer(secondJU, getAvailableMovesURL).length === 0) {
            gameEnded = true;
            alert("AI won!");
        } else if (this.getMovesFromServer(firstHE, getAvailableMovesURL).length === 0 && this.getMovesFromServer(secondHE, getAvailableMovesURL).length === 0) {
            gameEnded = true;
            alert("Human won!");
        }

        if (gameEnded) {
            if (window.confirm("Do you want to play another game?")) {
                window.location.reload();
            }
        }
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

    incDepth() {
        this.depth++;
        this.updateDepthUI();
    }

    decDepth() {
        this.depth--;
        this.updateDepthUI();
    }

    updateDepthUI() {
        const depthSpan = document.getElementById("graph-depth");
        depthSpan.textContent = this.depth;
    }

    canGoDeeper() {
        if (this.movesCount >= 30)
            this.depth = 5;

        if (this.movesCount >= 55)
            this.depth = 6;

        if (this.movesCount >= 70)
            this.depth = 7;
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

    clickHandle(idOfCell) {
        if (gameEnded || this.state.humanNext !== true)
            return;
        // if the board is empty, nothing on it yet
        if (this.buildersSetUp < 2) {
            this.setUpBuilders(idOfCell);

            if (this.buildersSetUp === 2)
                this.setUpAIBuilders();
            return;
        }

        // If we clicked on our builder
        if (this.lowerBoundCellValue <= this.state.cells[idOfCell] && this.state.cells[idOfCell] <= this.upperBoundCellValue) {
            // If we weren't moving, that is a builder is being selected
            if (this.moving === false && this.building === false && idOfCell !== this.lastClickedId && this.lastClickedId === -1) {
                this.lastClickedId = idOfCell;
                this.chooseMove = true;
            }
            // If we're undo-ing the selection of builder
            else if (idOfCell === this.lastClickedId && this.building === false) {
                this.chooseMove = false;
                this.moving = false;
                this.lastClickedId = -1;
                this.setState({ availableMovesOrBuilds: null });
            }
        }

        // If we selected a builder then we're in a phase of choosing where to move, builder can still be de-selected
        if (this.chooseMove === true) {
            if (this.lastClickedId === idOfCell)
                this.setupAvailableMoves(idOfCell, getAvailableMovesURL);
            else {
                this.chooseMove = false;
                this.moving = true;
            }
            // make a request for available moves 
            // make a converter to python - implemented game
        }

        // If we decided to move to a certain field and that field is in the list of allowed moves
        if (this.moving === true && this.state.availableMovesOrBuilds.find(x => x === idOfCell) != null) {
            this.moveFigure(this.lastClickedId, idOfCell, () => this.setupAvailableMoves(idOfCell, getAvailableBuildsURL));
            this.lastClickedId = -1;
            this.moving = false;
            this.building = true;
            return;
        }

        // If we decided to move to a certain field and that field is in the list of allowed moves
        if (this.building === true && this.state.availableMovesOrBuilds.find(x => x === idOfCell) != null) {
            this.buildBlock(idOfCell);
            this.building = false;
            this.setState({ availableMovesOrBuilds: null, humanNext: false }, () => this.doMoveAI(this.serverAiMoveURL, this.depth));
        }
    }

    doMoveAI(URL, depth) {
        // Check if human won
        this.checkWin();
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
                    default:
                        coordinatesMoveFrom = null;
                }

                this.moveFigure(coordinatesMoveFrom, move);
                this.buildBlock(build);
                // Check if AI has won
                this.checkWin();
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
            startPosition: null,
            depth: depth,
        }];
        const response = await axios
            .post(url, data)
            .catch((err) => { console.log(err) });

        return response;
    }

    setUpBuilders(idOfCell) {
        const cells = this.state.cells;
        cells[idOfCell] = 9;
        this.setState({
            cells: cells,
            firstJU: this.buildersSetUp === 0 ? idOfCell : this.state.firstJU,
            secondJU: this.buildersSetUp === 1 ? idOfCell : this.state.secondJU
        }, () => ++this.buildersSetUp === 2 ? this.setUpAIBuilders() : null);
    }

    setUpAIBuilders() {
        const firstJULocal = this.state.firstJU;
        const secondJULocal = this.state.secondJU;

        let firstHE = 0;
        let secondHE = 0;

        let combinationsFirst = [7, 6, 8];
        let combinationsSecond = [17, 18, 19];

        for (let i = 0; i < 3; i++) {
            if (combinationsFirst[i] !== firstJULocal && combinationsFirst[i] !== secondJULocal && firstHE === 0)
                firstHE = combinationsFirst[i];

            if (combinationsSecond[i] !== firstJULocal && combinationsSecond[i] !== secondJULocal && secondHE === 0)
                secondHE = combinationsSecond[i];

            if (firstHE && secondHE)
                break;
        }
        /*
        const firstJULocal = this.state.firstJU;
        const secondJULocal = this.state.secondJU;
        let availableCells = Array(25).fill(undefined).map((_, i) => i);

        for (var i = availableCells.length - 1; i >= 0; i--) {
            if (availableCells[i] === firstJULocal || availableCells[i] === secondJULocal) {
                availableCells.splice(i, 1);
            }
        }

        let positions = [6, -6, 5, -5, 1, -1];

        if (firstJULocal > 12)
            positions = positions.map(x => -x);

        let firstHE = availableCells[Math.random(25)]
        let secondHE = availableCells[Math.random(25)]

        const firstHEPositions = positions.map(x => firstJULocal + x);
        for (let i = 0; i < firstHEPositions.length; i++) {
            if (availableCells.includes(firstHEPositions[i])) {
                firstHE = firstHEPositions[i];
                break;
            }
        }

        positions = positions.map(x => -x);
        const secondHEPositions = positions.map(x => firstHE + x);
        for (let i = 0; i < secondHEPositions.length; i++) {
            if (availableCells.includes(secondHEPositions[i])) {
                secondHE = secondHEPositions[i];
                break;
            }
        }
        */

        const cells = this.state.cells.slice();
        cells[firstHE] = 5;
        cells[secondHE] = 5;
        this.setState({
            firstHE: firstHE,
            secondHE: secondHE,
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

    // Pravimo blok
    buildBlock(onCell) {
        const cells = this.state.cells.slice();
        cells[onCell] += 1;
        this.setState({
            cells: cells,
            humanNext: !this.state.humanNext
        });
    }

    // Moving a figure
    // TODO: note the changes of figure in state, maybe when setting up things then doing the changes here too?
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

}

export default Board;
