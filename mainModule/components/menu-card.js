import React from 'react';

function Card (props) {
    return (
        <li className="card"><a href={props.link}>{props.text}</a></li>
    );
}

export default Card;
