import * as assert from 'assert';
import { AnalyzedSettings, Mapper } from '../mapper';
import { ISetting, MappedSetting } from '../settings';
import * as testData from './testData';

suite('Importer Tests', async () => {

    const expected = new Map<string, MappedSetting>([
        ['numberSetting', new MappedSetting({ name: 'tab_size$test', value: 12 }, { name: 'editor.tabSize$test', value: 12 })],
        ['stringSetting', new MappedSetting({ name: 'word_separators$test', value: "./\\()\"'-:,.;<>~!@#$%^&*|+=[]{}`~?" }, { name: 'editor.wordSeparators$test', value: "./\\()\"'-:,.;<>~!@#$%^&*|+=[]{}`~?" })],
        ['boolSetting', new MappedSetting({ name: 'ensure_newline_at_eof_on_save$test', value: false }, { name: 'files.insertFinalNewline$test', value: false })],
        ['complexSetting', new MappedSetting({ name: 'draw_white_space$test', value: 'boundary' }, { name: 'editor.renderWhitespace$test', value: 'boundary' })],
    ]);

    test('Import different types', async () => {
        const testMappings = Promise.resolve(testData.testMappings);
        const mapper: Mapper = new Mapper(testMappings);
        const settings: AnalyzedSettings = await mapper.getMappedSettings(JSON.stringify(testData.sublimeSettings));
        assert.ok(settings.mappedSettings.length === 4, `mappedSettings.length is ${settings.mappedSettings.length} instead of 4`);
        expected.forEach((expSetting) => {
            const setting = settings.mappedSettings.find(m => m.sublime.name === expSetting.sublime.name);
            if (!setting) {
                assert.fail(JSON.stringify(expSetting), 'Could not find mapped setting');
            } else {
                assert.ok(setting.vscode.name === expSetting.vscode.name
                    && setting.vscode.value === expSetting.vscode.value,
                    `Setting ${setting.vscode.name}: ${setting.vscode.value} failed`);
            }
        });
    });

    const alreadyExistingVsSettings: ISetting[] = [
        { name: 'editor.sameKeySameValue', value: true },
        { name: 'editor.sameKeyDiffVal', value: 'jajslfn' },
    ];

    test('Categorization of settings works', async () => {
        const mockConfig = {
            inspect: ((s: string) => {
                const foundSetting: ISetting | undefined = alreadyExistingVsSettings.find((setting) => setting.name === s);
                if (foundSetting) {
                    return { globalValue: foundSetting.value };
                }
                return undefined;
            }),
        };

        const testMappings = Promise.resolve(testData.testMappings);
        const mapper: Mapper = new Mapper(testMappings, mockConfig);
        const sublimeSettings = JSON.stringify({ ...testData.sublimeSettings, ...testData.sublimeSettingNoMapping, ...testData.sublimeSettingSameKeyDiffVal, ...testData.sublimeSettingSameKeyVal });
        const settings: AnalyzedSettings = await mapper.getMappedSettings(sublimeSettings);

        assert.ok(settings.alreadyExisting.length === 1);
        assert.ok(settings.noMappings.length === 1);
    });
});