import { v4 as uuid } from 'uuid'
import { EventStore, Event } from "@pun-ci/eventstore";

type UserCreated = Event<
    'UserCreated',
    {
        id: string,
        githubUserId: number,
    }
>

export class Users {

    constructor(
        private eventstore: EventStore
    ) { }

    public async getUserIdByGithubUserId(githubUserId: number): Promise<string> {
        const streamId = `user-gh:${githubUserId}`;
        const stream = this.eventstore.stream<UserCreated>(streamId)
        const userId = await stream.reduce<string | null>(null, {
            UserCreated: ({ id }) => id
        })
        if (userId !== null) {
            return userId
        }

        const id = uuid()
        stream.addEvent({
            type: 'UserCreated',
            data: {
                githubUserId,
                id
            }
        })
        return id
    }

}
