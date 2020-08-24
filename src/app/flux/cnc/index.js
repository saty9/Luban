import ModelGroup from '../models/ModelGroup';
import { controller } from '../../lib/controller';
import {
    ACTION_RESET_CALCULATED_STATE, ACTION_UPDATE_CONFIG,
    ACTION_UPDATE_GCODE_CONFIG,
    ACTION_UPDATE_STATE,
    ACTION_UPDATE_TRANSFORMATION
} from '../actionType';
import { actions as editorActions, CNC_LASER_STAGE } from '../editor';
import ToolPathModelGroup from '../models/ToolPathModelGroup';
import { CNC_TOOL_SNAP_V_BIT_CONFIG, JOB_TYPE_3AXIS, PAGE_EDITOR } from '../../constants';
import SvgModelGroup from '../models/SvgModelGroup';

const ACTION_CHANGE_TOOL_PARAMS = 'cnc/ACTION_CHANGE_TOOL_PARAMS';

const INITIAL_STATE = {

    jobType: JOB_TYPE_3AXIS,
    jobSize: {
        diameter: 24
    },

    page: PAGE_EDITOR,

    stage: CNC_LASER_STAGE.EMPTY,
    progress: 0,

    modelGroup: new ModelGroup(),
    toolPathModelGroup: new ToolPathModelGroup(),
    svgModelGroup: new SvgModelGroup(),

    isAllModelsPreviewed: false,
    isGcodeGenerating: false,
    gcodeFile: null,

    // model: null,
    selectedModelID: null,
    selectedModelHideFlag: null,
    sourceType: '',
    mode: '', // bw, greyscale, vector
    showOrigin: null,

    printOrder: 1,
    transformation: {},
    transformationUpdateTime: new Date().getTime(),

    gcodeConfig: {},
    config: {},

    toolSnap: '',
    toolParams: {
        toolDiameter: CNC_TOOL_SNAP_V_BIT_CONFIG.diameter, // tool diameter (in mm)
        toolAngle: CNC_TOOL_SNAP_V_BIT_CONFIG.angle, // tool angle (in degree, defaults to 30° for V-Bit)，
        toolShaftDiameter: CNC_TOOL_SNAP_V_BIT_CONFIG.shaftDiameter // tool angle (in degree, defaults to 30° for V-Bit)
    },

    // snapshot state
    undoSnapshots: [{ models: [], toolPathModels: [] }], // snapshot { models, toolPathModels }
    redoSnapshots: [], // snapshot { models, toolPathModels }
    canUndo: false,
    canRedo: false,

    // modelGroup state
    hasModel: false,
    isAnyModelOverstepped: false,

    // boundingBox: new THREE.Box3(new THREE.Vector3(), new THREE.Vector3()), // bbox of selected model

    previewFailed: false,
    autoPreviewEnabled: true,

    // rendering
    renderingTimestamp: 0
};

export const actions = {
    init: () => (dispatch) => {
        dispatch(editorActions.init('cnc'));

        const controllerEvents = {
            'taskCompleted:generateToolPath': (taskResult) => {
                if (taskResult.headType === 'cnc') {
                    dispatch(editorActions.onReceiveTaskResult('cnc', taskResult));
                }
            },
            'taskCompleted:generateGcode': (taskResult) => {
                if (taskResult.headType === 'cnc') {
                    dispatch(editorActions.onReceiveGcodeTaskResult('cnc', taskResult));
                }
            },
            'taskProgress:generateToolPath': (taskResult) => {
                if (taskResult.headType === 'cnc') {
                    dispatch(editorActions.updateState('cnc', {
                        progress: taskResult.progress
                    }));
                }
            },
            'taskProgress:generateGcode': (taskResult) => {
                if (taskResult.headType === 'cnc') {
                    dispatch(editorActions.updateState('cnc', {
                        progress: taskResult.progress
                    }));
                }
            }
        };

        Object.keys(controllerEvents).forEach(event => {
            controller.on(event, controllerEvents[event]);
        });
    },

    changeToolParams: (toolParams) => {
        return {
            type: ACTION_CHANGE_TOOL_PARAMS,
            toolParams
        };
    }
};

export default function reducer(state = INITIAL_STATE, action) {
    const { headType, type } = action;
    if (headType === 'cnc') {
        switch (type) {
            case ACTION_UPDATE_STATE: {
                return Object.assign({}, state, { ...action.state });
            }
            case ACTION_RESET_CALCULATED_STATE: {
                return Object.assign({}, state, {
                    isAllModelsPreviewed: false
                });
            }
            case ACTION_UPDATE_TRANSFORMATION: {
                return Object.assign({}, state, {
                    transformation: { ...state.transformation, ...action.transformation },
                    transformationUpdateTime: +new Date()
                });
            }
            case ACTION_UPDATE_GCODE_CONFIG: {
                return Object.assign({}, state, {
                    gcodeConfig: { ...state.gcodeConfig, ...action.gcodeConfig }
                });
            }
            case ACTION_UPDATE_CONFIG: {
                return Object.assign({}, state, {
                    config: { ...state.config, ...action.config }
                });
            }
            default:
                return state;
        }
    } else {
        switch (type) {
            case ACTION_CHANGE_TOOL_PARAMS: {
                return Object.assign({}, state, {
                    toolParams: { ...state.toolParams, ...action.toolParams }
                });
            }
            default:
                return state;
        }
    }
}
