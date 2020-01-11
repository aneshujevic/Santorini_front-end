import React from 'react';

function Square(props) {
    return (
        <button className="square"  onClick={props.onClick}>
            <img src={props.src} alt="Polje" width="100%" height="100%"></img>
        </button>
    )
}

export default Square;