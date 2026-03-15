
import React from 'react';
import {
  Tile as TileType,
  PlayerPosition,
  GameMove,
  BoardEnd,
} from '@/engine/types';
import Tile from './Tile';

interface PlayerHandProps {
  tiles: TileType[];
  position: PlayerPosition;
  isCurrentPlayer: boolean;
  isHuman: boolean;
  selectedTile: TileType | null;
  validMoves: GameMove[];
  onTileClick: (tile: TileType) => void;
  revealTiles?: boolean;
  suggestedTileId?: string | null;
}

export default function PlayerHand({
  tiles,
  position,
  isCurrentPlayer,
  isHuman,
  selectedTile,
  validMoves,
  onTileClick,
  revealTiles = false,
  suggestedTileId = null,
}: PlayerHandProps) {
  const faceDown = !isHuman && !revealTiles;
  const isVertical = position === 'east' || position === 'west';

  const playerLabels: Record<PlayerPosition, string> = {
    south: '🧑 You',
    north: '🤝 Partner',
    east: '🤖 East',
    west: '🤖 West',
  };

  const playableTileIds = new Set(validMoves.map((m) => m.tile.id));

  return (
    <div
      className={`flex flex-col items-center gap-1 ${
        isCurrentPlayer ? 'player-area active' : ''
      } p-2 rounded-lg`}
    >
      <div
        className={`text-sm font-bold ${
          isCurrentPlayer ? 'text-yellow-300' : 'text-gray-300'
        }`}
      >
        {playerLabels[position]}
        {isCurrentPlayer && ' ⏳'}
      </div>
      <div
        className={`flex ${isVertical ? 'flex-col' : 'flex-row'} gap-1 ${
          isVertical ? 'items-center' : 'justify-center'
        } flex-wrap`}
      >
        {tiles.map((tile) => (
          <Tile
            key={tile.id}
            tile={tile}
            faceDown={faceDown}
            size={isHuman ? 'lg' : 'sm'}
            selected={selectedTile?.id === tile.id}
            playable={isHuman && playableTileIds.has(tile.id)}
            suggested={tile.id === suggestedTileId}
            horizontal={isVertical}
            onClick={() => {
              if (isHuman && isCurrentPlayer && playableTileIds.has(tile.id)) {
                onTileClick(tile);
              }
            }}
          />
        ))}
      </div>
    </div>
  );
}
