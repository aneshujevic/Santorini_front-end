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

        this.humanPlayer = props.human;
        this.chooseMove = false;
        this.moving = false;
        this.building = false;
        this.buildersSetUp = 0;
        this.lastClickedId = -1;
        this.serverAiMoveURL = getMoveAlphaBetaCustomAiURL;

        this.whoseMove = "Jupiter's move";

        // values from 9 to 12 belong to Jupiter 
        this.upperBoundCellValue = 12;
        this.lowerBoundCellValue = 9;
        this.movesCount = 0;
        this.depth = 4;
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
                    default:
                        coordinatesMoveFrom = null;
                }

                this.moveFigure(coordinatesMoveFrom, move);
                this.buildBlock(build);

                // Check if AI has won
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

        if (cells[idOfCell] !== 0) {
            alert("Field is taken, please try again..");
            return;
        }

        cells[idOfCell] = 9;
        this.logSetupUI(idOfCell, this.buildersSetUp);

        this.setState({
            cells: cells,
            firstJU: this.buildersSetUp === 0 ? idOfCell : this.state.firstJU,
            secondJU: this.buildersSetUp === 1 ? idOfCell : this.state.secondJU
        }, () => ++this.buildersSetUp === 2 ? this.setUpAIBuilders() : null);
    }

    setUpAIBuilders(first = -1, second = -1) {
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

        if (first !== -1 && second !== -1) {
            firstHE = first;
            secondHE = second;
        }

        const cells = this.state.cells.slice();
        cells[firstHE] = 5;
        cells[secondHE] = 5;

        this.logSetupUI(firstHE, 2);
        this.logSetupUI(secondHE, 3);

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

    // Moving a figure
    moveFigure(fromCell, toCell, callBackFunction) {
        const multiplier = Math.floor((this.state.cells[fromCell] + 1) / 5);
        const cells = this.state.cells.slice();
        const oldValueOfCell = cells[fromCell];
        cells[fromCell] = oldValueOfCell >= 9 ? (cells[fromCell] + 1) % 5 : cells[fromCell] % 5;
        cells[toCell] = oldValueOfCell >= 9 ? 5 * multiplier + cells[toCell] - 1 : 5 * multiplier + cells[toCell];

        this.logMoveUI(fromCell, false);
        this.logMoveUI(toCell, false);

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

        this.logMoveUI(onCell, true);

        this.setState({
            cells: cells,
            humanNext: !this.state.humanNext
        });
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
            return;
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

    downloadState() {
        let text = document.getElementById("moves").innerHTML;
        text = text.replace(/\s?<br>\s?/g, "\n");
        text += "\n";

        var element = document.createElement('a');
        element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
        element.setAttribute('download', "game_state.txt");

        element.style.display = 'none';
        document.body.appendChild(element);

        element.click();

        document.body.removeChild(element);
    }

    loadState(event) {
        if (this.state.firstJU === -1) {
            const reader = new FileReader();
            reader.onload = (e) => this.loadMoves(e);
            reader.readAsText(event.target.files[0]);
        } else {
            if (window.confirm("You must refresh page before importing a game state.\nRefresh now?"))
                window.location.reload();
        }
    }

    loadMoves(event) {
        const text = event.target.result.trim().split("\n");
        this.setUpBuildersFromImport(text);
        this.doMovesFromImport(text);
    }

    doMovesFromImport(text) {
        while (text.length !== 0) {
            let triplet = text.shift();
            let singleMovesArray = triplet.split(" ");
            let moveFrom = this.convertCoordinatesImport(singleMovesArray[0]);
            let moveTo = this.convertCoordinatesImport(singleMovesArray[1]);
            let buildOn = this.convertCoordinatesImport(singleMovesArray[2]);

            this.moveFigure(moveFrom, moveTo);
            this.buildBlock(buildOn);
        };
    }

    setUpBuildersFromImport(text) {
        for (let i = 0; i < 2; i++) {
            let firstRow = text.shift().split(" ");
            let numberOfCellFirst = this.convertCoordinatesImport(firstRow[0]);
            let numberOfCellSecond = this.convertCoordinatesImport(firstRow[1]);

            if (i < 1) {
                this.setUpBuilders(numberOfCellFirst);
                this.setUpBuilders(numberOfCellSecond);
            }
            else {
                this.setUpAIBuilders(numberOfCellFirst, numberOfCellSecond);
            }
        }
    }

    convertCoordinatesImport(coordinateString) {
        let row = coordinateString[0];
        let column = parseInt(coordinateString[1]) - 1;

        switch (row) {
            case "A":
                row = 0;
                break;
            case "B":
                row = 1;
                break;
            case "C":
                row = 2;
                break;
            case "D":
                row = 3;
                break;
            case "E":
                row = 4;
                break;
            default:
                break;
        }

        return row * 5 + column;
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

    logMoveUI(move, isBuild) {
        const movesDiv = document.getElementById("moves");
        let resString = this.convertCoordinatesExport(move);

        if (isBuild)
            resString += "<br>";

        movesDiv.innerHTML += resString;
    }

    logSetupUI(whereSetUp, builderNumber) {
        const movesDiv = document.getElementById("moves");
        let resString = this.convertCoordinatesExport(whereSetUp);

        switch (builderNumber) {
            case 1:
            case 3:
                resString += "<br>";
                break;
            default:
                break;
        }

        movesDiv.innerHTML += resString;
    }

    convertCoordinatesExport(coordinate) {
        let row = Math.floor(coordinate / 5);
        let column = coordinate % 5;

        let resultString = "";

        switch (row) {
            case 0:
                resultString += "A";
                break;
            case 1:
                resultString += "B";
                break;
            case 2:
                resultString += "C";
                break;
            case 3:
                resultString += "D";
                break;
            case 4:
                resultString += "E";
                break;
            default:
                return;
        }

        resultString += String(column + 1) + " ";
        return resultString;
    }

    changeMoveUI() {
        switch (this.state.humanNext) {
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
                    <div className="first-row">
                        <div className="column-number-cell">
                            1
                        </div>
                        <div className="column-number-cell">
                            2
                        </div>
                        <div className="column-number-cell">
                            3
                        </div>
                        <div className="column-number-cell">
                            4
                        </div>
                        <div className="column-number-cell">
                            5
                        </div>
                    </div>
                    <div className="board-row">
                        <span className="row-number-cell">A</span>
                        {this.renderSquare(sources[0], 0)}
                        {this.renderSquare(sources[1], 1)}
                        {this.renderSquare(sources[2], 2)}
                        {this.renderSquare(sources[3], 3)}
                        {this.renderSquare(sources[4], 4)}
                    </div>
                    <div className="board-row">
                        <span className="row-number-cell">B</span>
                        {this.renderSquare(sources[5], 5)}
                        {this.renderSquare(sources[6], 6)}
                        {this.renderSquare(sources[7], 7)}
                        {this.renderSquare(sources[8], 8)}
                        {this.renderSquare(sources[9], 9)}
                    </div>
                    <div className="board-row">
                        <span className="row-number-cell">C</span>
                        {this.renderSquare(sources[10], 10)}
                        {this.renderSquare(sources[11], 11)}
                        {this.renderSquare(sources[12], 12)}
                        {this.renderSquare(sources[13], 13)}
                        {this.renderSquare(sources[14], 14)}
                    </div>
                    <div className="board-row">
                        <span className="row-number-cell">D</span>
                        {this.renderSquare(sources[15], 15)}
                        {this.renderSquare(sources[16], 16)}
                        {this.renderSquare(sources[17], 17)}
                        {this.renderSquare(sources[18], 18)}
                        {this.renderSquare(sources[19], 19)}
                    </div>
                    <div className="board-row">
                        <span className="row-number-cell">E</span>
                        {this.renderSquare(sources[20], 20)}
                        {this.renderSquare(sources[21], 21)}
                        {this.renderSquare(sources[22], 22)}
                        {this.renderSquare(sources[23], 23)}
                        {this.renderSquare(sources[24], 24)}
                    </div>
                    <span className="who-move">{this.whoseMove}</span>
                </div>
                <Panel
                    side="right"
                    algorithmFun={() => this.changeUrl()}
                    increaseFun={() => this.incDepth()}
                    decreaseFun={() => this.decDepth()}
                    importState={(e) => this.loadState(e)}
                    exportState={() => this.downloadState()}
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
                src={`/static/images/${source}`}
                onClick={() => this.clickHandle(idOfCell)}
                glowing={glowing}
            />
        );
    }
}

export default Board;
