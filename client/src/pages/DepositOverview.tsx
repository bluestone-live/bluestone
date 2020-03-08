import React, { useState, useCallback, useMemo } from 'react';
import {
  useDepositTokens,
  IToken,
  usePools,
  PoolActions,
  useDepositTerms,
  useTestingDepositTerms,
  ITerm,
  IPool,
  useNetwork,
} from '../stores';
import TokenTab from '../components/TokenTab';
import { useDepsUpdated } from '../utils/useEffectAsync';
import DepositPoolCard from '../containers/DepositPoolCard';
import { getService } from '../services';
import { useDispatch } from 'react-redux';
import { Link, RouteComponentProps } from 'react-router-dom';
import { WithTranslation, withTranslation } from 'react-i18next';
import Dropdown from 'antd/lib/dropdown';
import Menu, { ClickParam } from 'antd/lib/menu';
import Button from 'antd/lib/button';
import Icon from 'antd/lib/icon';
import CustomPoolCard from '../containers/CustomPoolCard';
import { parseQuery } from '../utils/parseQuery';

interface IProps extends WithTranslation, RouteComponentProps<{}> {}

const DepositOverview = (props: IProps) => {
  const { location, t } = props;

  const queryParams = parseQuery(location.search);

  const dispatch = useDispatch();

  // Selectors
  const tokens = useDepositTokens();

  const network = useNetwork();

  const depositTerms =
    network === 'main' ? useDepositTerms() : useTestingDepositTerms();

  const sortingParams = useMemo(
    () => ['term', 'APR', 'utilization'],
    [],
  ) as Array<keyof IPool>;

  const allPools = usePools();

  // States
  const [selectedToken, setSelectedToken] = useState<IToken | undefined>(() =>
    tokens.find(token => token.tokenAddress === queryParams.tokenAddress),
  );
  const [sortBy, setSortBy] = useState<keyof IPool>(sortingParams[0]);

  // Init
  useDepsUpdated(async () => {
    if (selectedToken) {
      const { poolService } = await getService();

      dispatch(
        PoolActions.replacePools(
          selectedToken.tokenAddress,
          await poolService.getPoolsByToken(selectedToken.tokenAddress),
        ),
      );
    }
  }, [selectedToken]);

  useDepsUpdated(async () => {
    if (tokens.length > 0 && !selectedToken) {
      setSelectedToken(tokens[0]);
    }
  }, [tokens]);

  // Callbacks
  const onTokenSelect = useCallback(
    (token: IToken) => setSelectedToken(token),
    [tokens],
  );
  const onDropDownChange = useCallback(
    (param: ClickParam) => {
      setSortBy(param.key as keyof IPool);
    },
    [sortingParams],
  );

  // Computed
  const selectedPools = useMemo(() => {
    if (allPools && selectedToken) {
      return allPools[selectedToken.tokenAddress] || [];
    }
    return [];
  }, [allPools, selectedToken]);

  const depositPools = useMemo(() => {
    return depositTerms
      .map((term: ITerm) => {
        return selectedPools.find(pool => pool.term === term.value);
      })
      .sort((term1, term2) => {
        if (!term2) {
          return 1;
        }
        if (!term1) {
          return -1;
        }

        return (
          Number.parseFloat(term2[sortBy].toString()) -
          Number.parseFloat(term1[sortBy].toString())
        );
      });
  }, [selectedPools, depositTerms, sortBy]);

  const DropDownMenu = useMemo(
    () => (
      <Menu onClick={onDropDownChange}>
        {sortingParams.map(menu => (
          <Menu.Item key={menu}>
            {t(`deposit_overview_sorting_${menu}`)}
          </Menu.Item>
        ))}
      </Menu>
    ),
    [onDropDownChange, sortingParams],
  );

  // TODO: Only for testing
  const [selectedTerm, setSelectedTerm] = useState<number>(90);

  const onSelectedTermChange = useCallback(
    (term: string) => setSelectedTerm(Number.parseInt(term, 10)),
    [],
  );

  const selectedPool = useMemo(
    () => selectedPools.find(pool => pool.term === selectedTerm),
    [selectedTerm, selectedPools],
  );
  const minTerm = useMemo(() => {
    if (selectedPools.length > 0) {
      return selectedPools[0].term;
    }
    return 1;
  }, [selectedTerm, selectedPools]);
  const maxTerm = useMemo(() => {
    if (selectedPools.length > 0) {
      return selectedPools[selectedPools.length - 1].term;
    }
    return 1;
  }, [selectedTerm, selectedPools]);

  return (
    <div className="deposit-overview">
      <TokenTab
        tokens={tokens}
        onTokenSelect={onTokenSelect}
        selectedToken={selectedToken}
      />
      <div className="full-width title">
        <div className="title__text">{t('deposit_overview_title')}</div>
        <Dropdown
          overlay={DropDownMenu}
          trigger={['click']}
          placement="bottomCenter"
        >
          <Button className="sort-by">
            {t('deposit_overview_button_sort_by', {
              key: t(`deposit_overview_sorting_${sortBy}`),
            })}
            <Icon type="caret-down" />
          </Button>
        </Dropdown>
      </div>

      <div className="pools">
        {depositPools.map(
          (pool, index) =>
            pool && (
              <Link
                to={`/deposit/${pool.poolId}?tokenAddress=${selectedToken &&
                  selectedToken.tokenAddress}`}
                key={`link_${pool.poolId.toString()}`}
              >
                <DepositPoolCard
                  isMostBorrowed={index === 0}
                  key={pool.poolId.toString()}
                  pool={pool}
                  highlightColumn={sortBy}
                />
              </Link>
            ),
        )}
        {network !== 'main' && (
          <CustomPoolCard
            pool={selectedPool}
            selectedTerm={selectedTerm}
            selectedToken={selectedToken}
            onSelectedTermChange={onSelectedTermChange}
            minTerm={minTerm}
            maxTerm={maxTerm}
          />
        )}
      </div>
    </div>
  );
};

export default withTranslation()(DepositOverview);
