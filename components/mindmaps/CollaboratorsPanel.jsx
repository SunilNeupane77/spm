import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

export default function CollaboratorsPanel({ connected, activeUsers, owner }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <div className="flex items-center cursor-pointer hover:bg-muted p-2 rounded-md">
          <div className="relative flex -space-x-2 overflow-hidden">
            {activeUsers.slice(0, 3).map(user => (
              <Avatar key={user.id} className="h-6 w-6 border-2 border-background">
                <AvatarImage src={user.image} alt={user.name} />
                <AvatarFallback>{user.name?.charAt(0)}</AvatarFallback>
              </Avatar>
            ))}
            {activeUsers.length > 3 && (
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs">
                +{activeUsers.length - 3}
              </div>
            )}
          </div>
          {connected && <span className="h-2 w-2 bg-green-500 rounded-full ml-2"></span>}
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-64">
        <h3 className="font-medium mb-2">Active Collaborators</h3>
        {activeUsers.length === 0 ? (
          <p className="text-sm text-muted-foreground">No active users</p>
        ) : (
          <div className="space-y-2">
            {activeUsers.map(user => (
              <div key={user.id} className="flex items-center gap-2">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={user.image} alt={user.name} />
                  <AvatarFallback>{user.name?.charAt(0)}</AvatarFallback>
                </Avatar>
                <span className="text-sm">{user.name}</span>
                {user.id === owner && (
                  <Badge variant="outline" className="ml-auto text-xs">Owner</Badge>
                )}
              </div>
            ))}
          </div>
        )}
        )}
       </PopoverContent>
     </Popover>
   );
}
