import { AnyModel } from '@anywidget/types';
import { WebMidi, InputEventMap, Event, WebMidiEventMap } from 'webmidi';
import type { EventEmitter, NoteMessageEvent } from 'webmidi';
import enableMIDI from './enable_midi';

type ObjectHash = Record<string, any>;

export interface ListenerModel extends ObjectHash {
    _target_id: string | null;
    _target_type: 'webmidi' | 'input';
    _event: string;
    _prop_names: string[];
    suspended: boolean;
    count: number;
}

type PropGetter = (e: any) => any;

function getPropGetter(name: string): PropGetter {
    let nameJS: string;
    let getter: PropGetter;

    const toCamelCase = (str: string) => {
        return str.replace(/_([a-z])/g, (_, p1) => p1.toUpperCase());
    };

    if (name.startsWith('note_')) {
        nameJS = toCamelCase(name.replace('note_', ''));

        getter = (e: NoteMessageEvent) => {
            return (e.note as any)[nameJS];
        };
    } else {
        nameJS = toCamelCase(name);

        getter = (e: Event) => {
            return (e as any)[nameJS];
        };
    }

    return getter;
}

export async function initialize_listener({
    model,
}: {
    model: AnyModel<ListenerModel>;
}) {
    await enableMIDI();

    const propNames = model.get('_prop_names');
    const propNamesGetters = propNames.map((pn) => {
        return getPropGetter(pn);
    });

    const callback = (e: Event) => {
        propNames.forEach((pn, i) => {
            model.set(pn, propNamesGetters[i](e));
        });
        model.set('count', model.get('count') + 1);
        model.save_changes();
    };

    const targetType = model.get('_target_type');

    let eventName: keyof InputEventMap | keyof WebMidiEventMap;
    let target: EventEmitter;

    if (targetType === 'input') {
        eventName = model.get('_event') as keyof InputEventMap;
        const target_id = model.get('_target_id') as string;
        target = WebMidi.getInputById(target_id);
    } else {
        // targetType === 'webmidi'
        eventName = model.get('_event') as keyof WebMidiEventMap;
        target = WebMidi;
    }

    // cleanup (HMR)
    target.removeListener(eventName, callback);

    target.addListener(eventName, callback);

    model.on('change:suspended', () => {
        if (model.get('suspended')) {
            target.removeListener(eventName, callback);
        } else {
            if (!target.hasListener(eventName, callback)) {
                target.addListener(eventName, callback);
            }
        }
    });

    // TODO: use model.once when it is exposed in AnyWidget's interface
    // https://github.com/manzt/anywidget/issues/402
    model.on('destroy', () => {
        target.removeListener(eventName, callback);
    });
}

// TODO: basic render with visual cue and trait values when the MIDI event is triggered
