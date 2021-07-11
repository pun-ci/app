import { EventStoreDBClient, EventType, EventTypeToRecordedEvent, jsonEvent, JSONEventData, JSONEventType, ResolvedEvent } from '@eventstore/db-client'
import { ReadStreamOptions } from '@eventstore/db-client/dist/streams'

export interface EventStoreDb {

    addEvent(streamName: string, event: JSONEventData): Promise<void>

    getAllEvents<T extends EventType>(
        streamName: string
    ): Promise<EventTypeToRecordedEvent<T>[]>

}

class InvalidEvent extends Error { }

class EventStore implements EventStoreDb {

    constructor(
        private dbClient: EventStoreDBClient
    ) { }

    public async addEvent(streamName: string, event: JSONEventData) {
        await this.dbClient.appendToStream(streamName, [event])
    }

    public async getAllEvents<T extends EventType>(
        streamName: string
    ): Promise<EventTypeToRecordedEvent<T>[]> {
        try {
            const events = await this.dbClient.readStream<T>(streamName)
            return events.map(e => {
                if (e.event) {
                    return e.event
                }
                if (e.link) {
                    return e.link
                }
                throw new InvalidEvent()
            })
        } catch (err) {
            if (err.type === 'stream-not-found') {
                return []
            }
            throw err
        }
    }

}

export const createDb = (connectionString: string): EventStoreDb => new EventStore(
    EventStoreDBClient.connectionString(connectionString)
)
