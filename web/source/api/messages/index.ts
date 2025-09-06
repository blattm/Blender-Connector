export { ConnectionBlenderMessage as ConnectionBlender } from './connectionBlenderMessage';
export { ConnectionInputMessage as ConnectionInput } from './connectionInputMessage';
export { ConnectionOutputMessage as ConnectionOutput } from './connectionOutputMessage';
export { GlobalMicrophoneMessage as GlobalMicrophone } from './globalMicrophoneMessage';
export { GlobalMutedMessage as GlobalMuted } from './globalMutedMessage';
export { OutputCompressorStateMessage as OutputCompressorState } from './outputCompressorStateMessage';
export { OutputCompressorValueMessage as OutputCompressorValue } from './outputCompressorValueMessage';
export { OutputInputVolumeMessage as OutputInputVolume } from './outputInputVolumeMessage';
export { OutputMicrophoneVolumeMessage as OutputMicrophoneVolume } from './outputMicrophoneVolumeMessage';
export { OutputSoundVolumeMessage as OutputSoundVolume } from './outputSoundVolumeMessage';
export { StateMessage as State } from './stateMessage';

import { ConnectionBlenderMessage } from './connectionBlenderMessage';
import { ConnectionInputMessage } from './connectionInputMessage';
import { ConnectionOutputMessage } from './connectionOutputMessage';
import { GlobalMicrophoneMessage } from './globalMicrophoneMessage';
import { GlobalMutedMessage } from './globalMutedMessage';
import { OutputCompressorStateMessage } from './outputCompressorStateMessage';
import { OutputCompressorValueMessage } from './outputCompressorValueMessage';
import { OutputInputVolumeMessage } from './outputInputVolumeMessage';
import { OutputMicrophoneVolumeMessage } from './outputMicrophoneVolumeMessage';
import { OutputSoundVolumeMessage } from './outputSoundVolumeMessage';
import { StateMessage } from './stateMessage';

export type Message = ConnectionBlenderMessage |
    ConnectionInputMessage |
    ConnectionOutputMessage |
    GlobalMicrophoneMessage |
    GlobalMutedMessage |
    OutputCompressorStateMessage |
    OutputCompressorValueMessage |
    OutputInputVolumeMessage |
    OutputMicrophoneVolumeMessage |
    OutputSoundVolumeMessage |
    StateMessage;

export type NotifyMessage = ConnectionBlenderMessage |
    ConnectionInputMessage |
    ConnectionOutputMessage |
    GlobalMicrophoneMessage |
    GlobalMutedMessage |
    OutputCompressorStateMessage |
    OutputCompressorValueMessage |
    OutputMicrophoneVolumeMessage |
    OutputInputVolumeMessage |
    OutputSoundVolumeMessage;

export type ConnectionMessage = ConnectionBlenderMessage | ConnectionInputMessage | ConnectionOutputMessage;

export type GlobalMessage = GlobalMicrophoneMessage | GlobalMutedMessage;

export type OutputMessage = OutputCompressorStateMessage |
    OutputCompressorValueMessage |
    OutputInputVolumeMessage |
    OutputMicrophoneVolumeMessage |
    OutputSoundVolumeMessage;
