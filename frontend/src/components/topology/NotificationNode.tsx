import { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { BellIcon } from '@heroicons/react/24/outline';

export type NotificationNodeData = {
    message: string;
    isActive?: boolean;
};

function NotificationNode({ data, isConnectable }: NodeProps<any>) {
    return (
        <div className={`px-4 py-2 shadow-md rounded-md border-2 bg-card min-w-[150px] transition-colors duration-300 ${data.isActive ? 'border-yellow-500 shadow-yellow-500/50' : 'border-border'
            }`}>
            <div className="flex items-center">
                <div className={`rounded-full w-8 h-8 flex justify-center items-center mr-2 ${data.isActive ? 'bg-yellow-100 text-yellow-600' : 'bg-muted text-muted-foreground'
                    }`}>
                    <BellIcon className="w-5 h-5" />
                </div>
                <div className="ml-2">
                    <div className="text-sm font-bold text-foreground">Notificación</div>
                    <div className="text-xs text-muted-foreground truncate max-w-[120px]">
                        {data.message || "Sin mensaje"}
                    </div>
                </div>
            </div>

            {/* Input Handle: Connects from Action Node */}
            <Handle
                type="target"
                position={Position.Left}
                isConnectable={isConnectable}
                className="w-3 h-3 bg-muted-foreground"
            />
        </div>
    );
}

export default memo(NotificationNode);
