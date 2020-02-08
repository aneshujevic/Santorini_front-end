import React from 'react';
import axios from 'axios';
import Square from './square';
import Panel from './panel';

const getAvailableMovesURL = "http://127.0.0.1:8000/getAvailableMoves/";
const getAvailableBuildsURL = "http://127.0.0.1:8000/getAvailableBuilds/";

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
            juNext: true,
        };

        this.humanPlayer = props.human;
        this.chooseMove = false;
        this.moving = false;
        this.building = false;
        this.buildersSetUp = 0;
        this.lastClickedId = -1;

        this.whoseMove = "Jupiter's move";

        // values from 9 to 12 belong to Jupiter 
        this.upperBoundCellValueJU = 12;
        this.lowerBoundCellValueJU = 9;

        // values from 4 to 8 belong to Hercules
        this.upperBoundCellValueHE = 8;
        this.lowerBoundCellValueHE = 4;
    }

    clickHandle(idOfCell) {
        if (gameEnded)
            return;

        // if the board is empty, nothing on it yet
        if (this.buildersSetUp < 2) {
            this.setUpBuilders(idOfCell);
            return;
        } else if (this.buildersSetUp < 4) {
            this.setUpBuilders(idOfCell);
            return;
        }

        let lowerBoundCellValue;
        let upperBoundCellValue;

        if (this.state.juNext) {
            // if it is Jupiter's turn
            lowerBoundCellValue = this.lowerBoundCellValueJU;
            upperBoundCellValue = this.upperBoundCellValueJU;
        } else {
            lowerBoundCellValue = this.lowerBoundCellValueHE;
            upperBoundCellValue = this.upperBoundCellValueHE;
        }

        // If we clicked on our builder
        if (lowerBoundCellValue <= this.state.cells[idOfCell] && this.state.cells[idOfCell] <= upperBoundCellValue) {
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
            this.setState({ availableMovesOrBuilds: null }, () => this.changeMoveUI());
        }
    }

    setUpBuilders(idOfCell) {
        const cells = this.state.cells;

        if (cells[idOfCell] !== 0) {
            alert("Field is taken, please try again..");
            return;
        }

        if (this.buildersSetUp < 2) {
            cells[idOfCell] = 9;

            this.setState({
                cells: cells,
                firstJU: this.buildersSetUp === 0 ? idOfCell : this.state.firstJU,
                secondJU: this.buildersSetUp === 1 ? idOfCell : this.state.secondJU,
                juNext: this.buildersSetUp === 1 ? !this.state.juNext : this.state.juNext
            }, () => this.changeMoveUI());
        } else if (this.buildersSetUp < 4) {
            cells[idOfCell] = 5;

            this.setState({
                cells: cells,
                firstHE: this.buildersSetUp === 2 ? idOfCell : this.state.firstHE,
                secondHE: this.buildersSetUp === 3 ? idOfCell : this.state.secondHE,
                juNext: this.buildersSetUp === 3 ? !this.state.juNext : this.state.juNext
            }, () => this.changeMoveUI());
        }

        this.buildersSetUp++;
        this.logSetupUI(idOfCell, this.buildersSetUp);
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
    }

    // Bulding a block
    buildBlock(onCell) {
        const cells = this.state.cells.slice();
        cells[onCell] += 1;

        this.logMoveUI(onCell, true);

        this.setState({
            cells: cells,
            juNext: !this.state.juNext
        }, () => this.checkWin());
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

    setUpBuildersFromImport(text) {
        for (let i = 0; i < 2; i++) {
            let firstRow = text.shift().split(" ");
            let numberOfCellFirst = this.convertCoordinatesImport(firstRow[0]);
            let numberOfCellSecond = this.convertCoordinatesImport(firstRow[1]);

            this.setUpBuilders(numberOfCellFirst);
            this.setUpBuilders(numberOfCellSecond);
        }
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


    convertCoordinatesOut(coordinate) {
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
                break;
        }

        resultString += String(column + 1) + " ";
        return resultString;
    }

    logMoveUI(move, isBuild) {
        const movesDiv = document.getElementById("moves");
        let resString = this.convertCoordinatesOut(move);

        if (isBuild)
            resString += "<br>";

        movesDiv.innerHTML += resString;
    }

    logSetupUI(whereSetUp, builderNumber) {
        const movesDiv = document.getElementById("moves");
        let resString = this.convertCoordinatesOut(whereSetUp);

        switch (builderNumber) {
            case 2:
            case 4:
                resString += "<br>";
                break;
            default:
                break;
        }

        movesDiv.innerHTML += resString;
    }

    changeMoveUI() {
        switch (this.state.juNext) {
            case false:
                this.whoseMove = "Hercules's move";
                break;
            case true:
                this.whoseMove = "Jupiter's move";
                break;
            default:
                break;
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
                    class="right-panel"
                    importState={(e) => this.loadState(e)}
                    exportState={() => this.downloadState()}
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
