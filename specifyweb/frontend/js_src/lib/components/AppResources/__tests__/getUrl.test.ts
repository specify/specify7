import { localized, RR } from "../../../utils/types";
import { icons } from "../../Atoms/Icons";
import { exportsForTests } from "../Create";
import { AppResourceMode } from "../helpers";
import { AppResourceType } from "../types";

const { getUrl } = exportsForTests;

// This is copied from Create.tsx, to not depend on that copy.
const appResourceTypes: RR<AppResourceMode, AppResourceType> = {
  appResources: {
    tableName: 'SpAppResource',
    icon: icons.cog,
    label: localized("App Resource"),
  },
  viewSets: {
    tableName: 'SpViewSetObj',
    icon: icons.pencilAt,
    label: localized("Form definition"),
  },
};

test("table is SpAppResource", ()=>{

    const result = getUrl(
        "TestKey",
        appResourceTypes.appResources,
        "testName",
        "application/json",
        "testFile"
    );

    expect(result).toBe(
        "/specify/resources/app-resource/new/?directorykey=TestKey&name=testName&mimetype=application%2Fjson&templatefile=testFile"
    );

});

test("table is SpViewSetObj", ()=>{

    const result = getUrl(
        "TestKey",
        appResourceTypes.viewSets,
        "testName",
        "application/json",
        "testFile"
    );

    expect(result).toBe(
        "/specify/resources/view-set/new/?directorykey=TestKey&name=testName&mimetype=application%2Fjson&templatefile=testFile"
    )

});