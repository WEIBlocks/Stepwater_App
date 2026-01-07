module.exports = {
  dependencies: {
    'stepwater-service': {
      root: './modules/StepWaterService',
      platforms: {
        android: {
          sourceDir: './modules/StepWaterService/android',
          packageImportPath: 'import com.stepwater.service.StepWaterServicePackage;',
          packageInstance: 'new StepWaterServicePackage()',
        },
        ios: null, // iOS not supported for this module
      },
    },
  },
};
