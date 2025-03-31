import React from 'react';

const Instructions: React.FC = () => {
  return (
    <div className="instructions text-sm">
      <h3 className="text-lg font-bold mb-2">How to Play Tetris</h3>
      
      <div className="space-y-3">
        <div>
          <h4 className="font-semibold">Goal:</h4>
          <p>Arrange falling tetrominoes to create complete horizontal lines. When a line is completed, it will disappear and you'll earn points.</p>
        </div>
        
        <div>
          <h4 className="font-semibold">Controls:</h4>
          <ul className="list-disc pl-5 space-y-1">
            <li>Left/Right Arrow Keys: Move piece horizontally</li>
            <li>Down Arrow Key: Soft drop (accelerate falling)</li>
            <li>Up Arrow Key: Rotate piece clockwise</li>
            <li>Space Bar: Hard drop (instantly drop piece)</li>
          </ul>
        </div>
        
        <div>
          <h4 className="font-semibold">Scoring:</h4>
          <ul className="list-disc pl-5 space-y-1">
            <li>1 line: 100 × level</li>
            <li>2 lines: 300 × level</li>
            <li>3 lines: 500 × level</li>
            <li>4 lines (Tetris): 800 × level</li>
          </ul>
        </div>
        
        <div>
          <h4 className="font-semibold">Level:</h4>
          <p>You advance to the next level after clearing 10 lines. The game speeds up with each level!</p>
        </div>
        
        <div>
          <h4 className="font-semibold">Multiplayer:</h4>
          <p>When you clear lines, "garbage" blocks will be sent to your opponent. The last player standing wins!</p>
        </div>
      </div>
    </div>
  );
};

export default Instructions;
