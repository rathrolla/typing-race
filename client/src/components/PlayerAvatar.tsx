interface PlayerLike {
  name: string;
  color: string;
}

interface Props {
  player: PlayerLike;
  size?: 'sm' | 'md' | 'lg';
}

const sizes = {
  sm: 'w-8 h-8 text-sm',
  md: 'w-10 h-10 text-base',
  lg: 'w-14 h-14 text-xl',
};

export function PlayerAvatar({ player, size = 'md' }: Props) {
  return (
    <div
      className={`${sizes[size]} rounded-full flex items-center justify-center font-bold shrink-0`}
      style={{
        backgroundColor: `${player.color}25`,
        color: player.color,
        boxShadow: `0 0 20px ${player.color}30`,
      }}
    >
      {player.name.charAt(0).toUpperCase()}
    </div>
  );
}
